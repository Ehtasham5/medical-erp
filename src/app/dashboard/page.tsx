import Link from "next/link";
import prisma from "@/lib/db";
import { AlertTriangle, ArrowUpRight, Boxes, CircleDollarSign, PackagePlus, ReceiptText, ShoppingBag } from "lucide-react";
import { getDefaultBranch } from "@/lib/branch";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const branch = await getDefaultBranch();
  const [stockCount, lowStockCount, sales] = await Promise.all([
    prisma.medicine.count({ where: { branchId: branch.id } }),
    prisma.medicine.count({ where: { branchId: branch.id, stockQuantity: { lte: 20 } } }),
    prisma.sale.aggregate({ where: { branchId: branch.id }, _sum: { totalAmount: true }, _count: true }),
  ]);

  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Dashboard</h1><div className="grid gap-4 md:grid-cols-3"><div>Sales: {money.format(Number(sales._sum.totalAmount ?? 0))}</div><div>Transactions: {sales._count}</div><div>Inventory: {stockCount} ({lowStockCount} low stock)</div></div></div>;
}
