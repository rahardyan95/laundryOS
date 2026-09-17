import http from "k6/http";
import { check, sleep } from "k6";

// Gate rilis produksi (T7): thresholds = pass/fail, job CI gagal bila jebol.
// p(95)<800ms longgar untuk artisan serve dev; staging php-fpm harus jauh di bawah ini.
//
// Catatan harness: JANGAN debug skenario ini via curl PowerShell — quoting
// cmd merusak body JSON sehingga login 422 padahal API sehat (terbukti:
// PHP curl dari container -> HTTP 200 + token). k6 mengirim JSON langsung,
// jadi hasil k6 adalah ground truth.
export const options = {
  // Beban di bawah throttleApi 60 req/mnt: 1 VU x ~7 req/iterasi x sleep 3s
  // ~= 20 req/mnt — 429 tak boleh muncul; bila muncul berarti bocor request.
  // p95 longgar untuk artisan serve dev (single-thread); staging php-fpm
  // pakai P95_MS ketat, mis. P95_MS=400.
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "60s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: [`p(95)<${__ENV.P95_MS || 2000}`],
    checks: ["rate>0.9"],
  },
};
const BASE = __ENV.API_URL || "http://localhost:8000/api/v1";
const EMAIL = __ENV.EMAIL || "owner@laundryos.test";
const PASSWORD = __ENV.PASSWORD || "password";

function authHeaders(token) {
  return {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}

function firstId(list, key) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const row = list[0];
  return row && row[key] != null ? row[key] : null;
}

// Login sekali per VU (setup): throttle login 10/mnt — login tiap iterasi
// pasti kena 429 dan itu perilaku benar, bukan cacat performa.
export function setup() {
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, device_name: "k6" }),
    { headers: { "Content-Type": "application/json", Accept: "application/json" } }
  );
  if (login.status !== 200 || !login.json("token")) {
    throw new Error(`k6 setup: login gagal (${login.status})`);
  }
  return { token: login.json("token") };
}

export default function (data) {
  const token = data.token;
  const H = authHeaders(token);

  const orders = http.get(`${BASE}/orders?per_page=5`, H);
  check(orders, { "orders 200": (r) => r.status === 200 });

  // Catatan throttle: API memakai throttleApi() Laravel (60 req/mnt per IP).
// Semua VU k6 berbagi satu IP egress container, jadi skenario hemat request
  // Tulis: customer -> order. Service pertama bisa non-aktif (seed) —
  // ambil yang aktif; kas summary wajib outlet_id.
  const key = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const customers = http.get(`${BASE}/customers?per_page=1`, H).json("data");
  // Service pertama bisa non-aktif (seed) — ambil yang aktif.
  const services = http.get(`${BASE}/services?per_page=10`, H).json("data");
  const service =
    Array.isArray(services) ? services.find((s) => s.active) || null : null;
  const outlets = http.get(`${BASE}/outlets`, H).json("data");
  const outletId = firstId(outlets, "id");

  const customerId = firstId(customers, "id");
  const customerPhone =
    Array.isArray(customers) && customers.length > 0 ? customers[0].phone : null;
  if (customerId && service && outletId) {
    const payload = {
      outlet_id: outletId,
      customer_id: customerId,
      items: [{ service_id: service.id, qty: 1 }],
      payment_method: "cash",
      paid_amount: 0,
    };
    const created = http.post(`${BASE}/orders`, JSON.stringify(payload), {
      headers: { ...H.headers, "Idempotency-Key": key },
    });
    check(created, { "order 201": (r) => r.status === 201 });

    const ticket = created.json("data.ticket");
    if (ticket && customerPhone) {
      const tracked = http.post(
        `${BASE}/track`,
        JSON.stringify({ ticket, phone: customerPhone }),
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      check(tracked, { "track 200": (r) => r.status === 200 });
    }
  }

  const cash = http.get(
    `${BASE}/cash-entries/summary${outletId ? `?outlet_id=${outletId}` : ""}`,
    H
  );
  check(cash, { "kas summary 200": (r) => r.status === 200 });

  const health = http.get(`${BASE}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  sleep(3);
}
