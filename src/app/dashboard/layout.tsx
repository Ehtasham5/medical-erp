import { UserButton } from "@clerk/nextjs";
import { Bell, ChevronDown, MapPin } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { requireStaff } from "@/lib/branch";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { branch } = await requireStaff();
  return (
    <div className="min-h-screen bg-[#f5f6f4] text-[#18211d]">
      <AppSidebar />
      <div className="lg:pl-[17.5rem]">
        <header className="sticky top-0 z-20 flex h-[4.75rem] items-center justify-between border-b border-[#dfe4df] bg-[#f5f6f4]/95 px-5 backdrop-blur sm:px-8 lg:px-10">
          <button className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#53615a] transition-colors hover:bg-white md:flex"><MapPin className="h-4 w-4 text-[#0f766e]" />{branch.name}<ChevronDown className="h-4 w-4" /></button>
          <div className="text-sm font-medium text-[#53615a] md:hidden">Nexora Health</div>
          <div className="flex items-center gap-3"><button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full text-[#53615a] transition-colors hover:bg-white hover:text-[#18211d]"><Bell className="h-[1.15rem] w-[1.15rem]" /><span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-[#e05d44]" /></button><div className="h-7 w-px bg-[#dfe4df]" /><UserButton /></div>
        </header>
        <main className="mx-auto max-w-[1600px] p-5 pb-24 sm:p-8 sm:pb-24 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
