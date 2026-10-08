import { StaffRole } from "@prisma/client";
import prisma from "@/lib/db";
import { managementRoles, requireStaff } from "@/lib/branch";
import { updateBranchSettings, updateStaffRole } from "@/actions/staff";

export default async function SettingsPage() {
  try {
    const { branch } = await requireStaff(managementRoles);
    const staff = await prisma.staffMember.findMany({ where: { branchId: branch.id }, orderBy: { createdAt: "asc" } });
    return <div className="max-w-3xl space-y-7"><div><p className="text-sm font-medium text-[#0f766e]">Workspace administration</p><h1 className="mt-1 text-3xl font-semibold">Settings</h1></div><form action={updateBranchSettings} className="grid gap-3 rounded border bg-white p-4 sm:grid-cols-2"><h2 className="sm:col-span-2 font-semibold">Branch configuration</h2><input name="name" defaultValue={branch.name} placeholder="Branch name" required/><input name="currency" defaultValue={branch.currency} placeholder="Currency (USD)" maxLength={3} required/><input name="address" defaultValue={branch.address ?? ""} placeholder="Address"/><input name="phone" defaultValue={branch.phone ?? ""} placeholder="Phone"/><input name="receiptHeader" defaultValue={branch.receiptHeader ?? ""} placeholder="Receipt header"/><input name="receiptFooter" defaultValue={branch.receiptFooter ?? ""} placeholder="Receipt footer"/><button className="rounded bg-teal-700 p-2 text-white sm:col-span-2">Save branch settings</button></form><div className="space-y-3"><h2 className="font-semibold">Team access</h2>{staff.map((member) => <form action={updateStaffRole} key={member.id} className="flex flex-wrap items-center gap-3 rounded border bg-white p-4"><code className="flex-1 text-xs">{member.clerkUserId}</code><input type="hidden" name="clerkUserId" value={member.clerkUserId}/><select name="role" defaultValue={member.role}>{Object.values(StaffRole).map((role) => <option key={role}>{role}</option>)}</select><select name="isActive" defaultValue={String(member.isActive)}><option value="true">Active</option><option value="false">Inactive</option></select><button className="rounded bg-slate-800 px-3 py-2 text-white">Save</button></form>)}</div></div>;
  } catch {
    return <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Access restricted</h1><p className="mt-2 text-sm">Settings are available only to a branch owner. Ask an owner to assign you the required role.</p></div>;
  }
}
