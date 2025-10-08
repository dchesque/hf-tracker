import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="lg:pl-[260px]">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}