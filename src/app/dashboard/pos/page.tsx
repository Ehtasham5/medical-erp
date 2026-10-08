import prisma from "@/lib/db";
import { POSClient } from "./pos-client";
import { getDefaultBranch } from "@/lib/branch";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const branch = await getDefaultBranch();
  const inventory = await prisma.medicine.findMany({
    where: {
      branchId: branch.id,
      stockQuantity: { gt: 0 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="h-full">
      <div className="mb-4">
        <p className="text-sm font-medium text-[#0f766e]">Counter checkout</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Point of sale</h1>
        <p className="mt-2 text-sm text-[#65736b]">Search available stock and complete a sale.</p>
      </div>
      
      {/* Pass the database items directly into the client checkout screen */}
      <POSClient branch={{ name: branch.name, address: branch.address, phone: branch.phone, currency: branch.currency, receiptHeader: branch.receiptHeader, receiptFooter: branch.receiptFooter }} inventory={inventory.map((medicine) => ({
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        batchNumber: medicine.batchNumber,
        stockQuantity: medicine.stockQuantity,
        price: Number(medicine.price),
      }))} />
    </div>
  );
}
