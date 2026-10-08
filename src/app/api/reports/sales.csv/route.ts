import { requireStaff, reportRoles } from "@/lib/branch";
import { getReportData } from "@/lib/reports";

export async function GET(request: Request) {
  let branch;
  try { ({ branch } = await requireStaff(reportRoles)); } catch { return new Response("Forbidden", { status: 403 }); }
  const { searchParams } = new URL(request.url); const report = await getReportData(branch.id, searchParams.get("from") ?? undefined, searchParams.get("to") ?? undefined);
  const lines = ["date,revenue", ...report.daily.map((point) => `${point.date},${point.amount.toFixed(2)}`)];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${branch.code.toLowerCase()}-sales-report.csv"` } });
}
