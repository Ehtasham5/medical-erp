"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addMedicine } from "@/actions/inventory";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AddMedicineDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = event.currentTarget;

    try {
      const result = await addMedicine(new FormData(form));
      if (result.success) {
        setOpen(false);
        form.reset();
      } else {
        setError(result.error ?? "Could not save the medicine. Please try again.");
      }
    } catch (submitError) {
      console.error("Failed to add medicine:", submitError);
      setError("Could not save the medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 gap-2 rounded-lg bg-[#0f766e] px-4 font-semibold hover:bg-[#0b625b]">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#dfe4df] sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-[-0.02em]">Add medicine batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4 text-[#243029]">
          <label className="block space-y-1.5 text-sm font-medium">
            Medicine Name
            <Input name="name" placeholder="e.g. Panadol 500mg" minLength={2} required />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Generic Name
            <Input name="genericName" placeholder="e.g. Paracetamol" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5 text-sm font-medium">
              Batch Number
              <Input name="batchNumber" placeholder="B-2026" required />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Expiry Date
              <Input name="expiryDate" type="date" required />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5 text-sm font-medium">
              Quantity
              <Input name="stockQuantity" type="number" min="0" step="1" required />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Selling Price ($)
              <Input name="price" type="number" min="0" step="0.01" required />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            Cost Price ($)
            <Input name="costPrice" type="number" min="0" step="0.01" required />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Medicine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
