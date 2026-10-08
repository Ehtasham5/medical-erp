import { forwardRef } from "react";

type InvoiceProps = {
  saleId: string;
  items: { name: string; price: number; cartQty: number }[];
  total: number;
  date: Date;
  paymentMethod?: string;
  receiptNumber?: string | null;
  branch: { name: string; address: string | null; phone: string | null; currency: string; receiptHeader: string | null; receiptFooter: string | null };
};

export const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ saleId, items, total, date, paymentMethod, receiptNumber, branch }, ref) => {
    return (
      <div ref={ref} className="p-4 w-[80mm] text-black bg-white font-mono text-sm">
        <div className="text-center mb-4">
          <h2 className="font-bold text-xl uppercase tracking-tighter">{branch.receiptHeader ?? branch.name}</h2>
          {branch.address && <p className="text-xs">{branch.address}</p>}
          {branch.phone && <p className="text-xs">Tel: {branch.phone}</p>}
        </div>
        
        <div className="border-t border-b border-black py-2 mb-2 text-xs">
          <p>Invoice #: {receiptNumber ?? saleId.slice(-8).toUpperCase()}</p>
          <p>Date: {date.toLocaleString()}</p>
          <p>Cashier: Ehtasham F.</p>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-1 w-1/2">Item</th>
              <th className="text-center py-1 w-1/4">Qty</th>
              <th className="text-right py-1 w-1/4">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 truncate pr-1">{item.name}</td>
                <td className="text-center py-1">{item.cartQty}</td>
                <td className="text-right py-1">{branch.currency} {(item.price * item.cartQty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black pt-2 flex justify-between font-bold text-base">
          <span>TOTAL</span>
          <span>{branch.currency} {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment Method</span>
          <span>{paymentMethod ?? "CASH"}</span>
        </div>

        <div className="text-center mt-8 text-xs space-y-1">
          <p>{branch.receiptFooter ?? "Thank you for your visit."}</p>
        </div>
      </div>
    );
  }
);

InvoiceReceipt.displayName = "InvoiceReceipt";
