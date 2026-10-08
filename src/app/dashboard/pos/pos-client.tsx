"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { InvoiceReceipt } from "./invoice-receipt";
import { useState } from "react";
import { checkoutSale } from "@/actions/pos"; // <-- Add this
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Medicine = {
  id: string;
  name: string;
  genericName: string | null;
  batchNumber: string;
  stockQuantity: number;
  price: number;
};

type CartItem = Medicine & { cartQty: number };
type ReceiptData = { saleId: string; items: CartItem[]; total: number; date: Date; paymentMethod: string; receiptNumber?: string | null };
type BranchReceipt = { name: string; address: string | null; phone: string | null; currency: string; receiptHeader: string | null; receiptFooter: string | null };

export function POSClient({ inventory, branch }: { inventory: Medicine[]; branch: BranchReceipt }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_WALLET">("CASH");
  const [discountAmount, setDiscountAmount] = useState("0.00");
  const [error, setError] = useState("");

  // Print functionality setup
  const printRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      setCart([]); // Clear cart ONLY after printing is done or cancelled
      setReceiptData(null);
    },
  });

  // Filter inventory based on search input
  const filteredMedicines = inventory.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.genericName ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addToCart = (medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicine.id);
      if (existing) {
        if (existing.cartQty >= medicine.stockQuantity) return prev;
        return prev.map((item) =>
          item.id === medicine.id
            ? { ...item, cartQty: item.cartQty + 1 }
            : item,
        );
      }
      return [...prev, { ...medicine, cartQty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.cartQty + delta;
          if (newQty > 0 && newQty <= item.stockQuantity) {
            return { ...item, cartQty: newQty };
          }
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.cartQty,
    0,
  );

  const handleCheckout = async () => {
    setError("");
    setIsPending(true);
    try {
      const saleData = {
        items: cart.map((item) => ({
          id: item.id,
          cartQty: item.cartQty,
        })),
        paymentMethod,
        discountAmount,
        requestId: crypto.randomUUID(),
      };

      const result = await checkoutSale(saleData);

      if (result.success) {
        // Save data for the receipt
        setReceiptData({
          saleId: result.saleId ?? "",
          items: [...cart],
          total: result.total ?? subtotal,
          date: new Date(),
          paymentMethod: result.paymentMethod ?? paymentMethod,
          receiptNumber: result.receiptNumber,
        });

        // Wait a tiny fraction of a second for React to render the hidden receipt, then print
        setTimeout(() => {
          handlePrint();
        }, 100);
      } else {
        setError(result.error ?? "Could not complete the sale.");
      }
    } catch (error) {
      console.error(error);
      setError("A network error occurred while processing the sale.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel: Medicine Search & Catalog */}
      <div className="flex-1 flex flex-col gap-4 bg-white p-4 rounded-xl border overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            className="pl-10 h-11 text-lg"
            placeholder="Search medicine or generic formula (e.g., Panadol)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800">{med.name}</h3>
                  <Badge
                    variant={
                      med.stockQuantity > 10 ? "secondary" : "destructive"
                    }
                  >
                    {med.stockQuantity} in stock
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  {med.genericName ?? "—"}
                </p>
                <p className="text-xs text-slate-400">
                  Batch: {med.batchNumber}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="font-bold text-lg">
                  {branch.currency} {med.price.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  onClick={() => addToCart(med)}
                  disabled={med.stockQuantity === 0}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          ))}
          {filteredMedicines.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500">
              No medicines found matching {searchTerm}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Active Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white p-4 rounded-xl border flex flex-col shadow-sm">
        <div className="flex items-center gap-2 border-b pb-4 mb-4">
          <ShoppingCart className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-800">Current Sale</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="h-10 w-10 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex justify-between font-medium text-slate-800">
                  <span>{item.name}</span>
                  <span>{branch.currency} {(item.price * item.cartQty).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-white rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQty(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.cartQty}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQty(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-7 w-7 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Totals */}
        <div className="border-t pt-4 mt-4 space-y-3 bg-slate-50 p-4 rounded-lg">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{branch.currency} {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <input value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} type="number" min="0" step="0.01" className="w-24 rounded border px-1 text-right" />
          </div>
          <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t">
            <span>Total</span>
            <span>{branch.currency} {Math.max(0, subtotal - Number(discountAmount || 0)).toFixed(2)}</span>
          </div>
          <label className="block text-sm text-slate-600">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "CASH" | "CARD" | "MOBILE_WALLET")} className="ml-2 rounded border p-1"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="MOBILE_WALLET">Mobile wallet</option></select></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full mt-4 py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700"
            disabled={cart.length === 0 || isPending}
            onClick={handleCheckout}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
              </span>
            ) : (
              "Complete Sale"
            )}
          </Button>
        </div>
      </div>
      <div className="hidden">
        {receiptData && (
          <InvoiceReceipt
            ref={printRef}
            saleId={receiptData.saleId}
            items={receiptData.items}
            total={receiptData.total}
            date={receiptData.date}
            paymentMethod={receiptData.paymentMethod}
            receiptNumber={receiptData.receiptNumber}
            branch={branch}
          />
        )}
      </div>
    </div>
  );
}
