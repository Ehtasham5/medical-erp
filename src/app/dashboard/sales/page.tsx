import prisma from "@/lib/db";
import { getDefaultBranch } from "@/lib/branch";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function SalesPage() {
  const branch = await getDefaultBranch();
  const sales = await prisma.sale.findMany({ where: { branchId: branch.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div><h1 className="text-3xl font-semibold">Sales history</h1><ul>{sales.map((sale) => <li key={sale.id}>{sale.createdAt.toLocaleString()} — {money.format(Number(sale.totalAmount))}</li>)}</ul></div>;
}
