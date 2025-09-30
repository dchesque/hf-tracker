import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}