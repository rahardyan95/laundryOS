import type { Order } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { OrderMachine } from "@/lib/order-machine";

export function OrderReceipt({ order, outletName }: { order: Order; outletName: string }) {
  const remaining = order.total - order.paidAmount;
  const paidLabel =
    order.paymentStatus === "paid"
      ? "LUNAS"
      : order.paymentStatus === "partial"
        ? `DP ${Format.rupiah(order.paidAmount)}`
        : "BELUM LUNAS";

  return (
    <div className="receipt mx-auto w-72 font-mono text-xs leading-relaxed text-black">
      <p className="text-center text-base font-bold tracking-tight">LaundryOS</p>
      <p className="text-center font-bold">{outletName}</p>
      <p className="my-2 border-t-2 border-black" aria-hidden />

      <p className="text-center text-sm font-bold tracking-widest">{order.ticket}</p>
      <p className="text-center">{Format.dateTime(order.createdAt)}</p>
      <p className="my-2 border-t border-dashed border-black" aria-hidden />

      <div className="flex justify-between">
        <span>Pelanggan</span>
        <span className="font-bold">{order.customerName}</span>
      </div>
      <div className="flex justify-between">
        <span>Telepon</span>
        <span>{order.customerPhone}</span>
      </div>
      <p className="my-2 border-t border-dashed border-black" aria-hidden />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 pr-1 font-bold">Layanan</th>
            <th className="py-1 pr-1 text-right font-bold">Jml</th>
            <th className="py-1 text-right font-bold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-dotted align-top">
              <td className="py-1 pr-1">
                {item.serviceName}
                <br />
                <span>
                  {item.qty} {item.unit} x {Format.rupiah(item.unitPrice)}
                </span>
              </td>
              <td className="py-1 pr-1 text-right">{item.qty}</td>
              <td className="py-1 text-right">{Format.rupiah(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 border-2 border-black p-2">
        <div className="flex justify-between">
          <span>TOTAL</span>
          <span className="font-bold">{Format.rupiah(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Dibayar</span>
          <span>{Format.rupiah(order.paidAmount)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>SISA</span>
          <span>{Format.rupiah(remaining)}</span>
        </div>
      </div>

      <p className="mx-auto mt-3 w-fit border-2 border-black px-4 py-1 text-sm font-bold tracking-widest">
        {paidLabel}
      </p>

      <p className="my-2 border-t border-dashed border-black" aria-hidden />
      <div className="flex justify-between">
        <span>Status</span>
        <span className="font-bold">{OrderMachine.label(order.status)}</span>
      </div>
      {order.estimatedDoneAt ? (
        <div className="flex justify-between">
          <span>Estimasi selesai</span>
          <span>{Format.dateTime(order.estimatedDoneAt)}</span>
        </div>
      ) : null}
      {order.note ? <p>Catatan: {order.note}</p> : null}

      <p className="my-2 border-t-2 border-black" aria-hidden />
      <p className="text-center">Terima kasih atas kepercayaan Anda.</p>
      <p className="text-center">Barang &gt; 30 hari bukan tanggung jawab kami.</p>
      <p className="text-center">Simpan struk ini sebagai bukti pengambilan.</p>
    </div>
  );
}
