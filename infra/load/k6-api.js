import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

const BASE = __ENV.API_URL || "http://localhost:8000/api/v1";
const EMAIL = __ENV.EMAIL || "owner@laundryos.test";
const PASSWORD = __ENV.PASSWORD || "password";

export default function () {
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, device_name: "k6" }),
    { headers: { "Content-Type": "application/json", Accept: "application/json" } }
  );

  check(login, {
    "login 200": (r) => r.status === 200,
    "login punya token": (r) => Boolean(r.json("token")),
  });

  const token = login.json("token");
  const headers = { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } };

  const orders = http.get(`${BASE}/orders`, headers);
  check(orders, { "orders 200": (r) => r.status === 200 });

  const health = http.get(`${BASE}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  sleep(1);
}
