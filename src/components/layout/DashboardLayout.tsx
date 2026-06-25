import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MobileBottomNav from "./MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div className="min-h-screen bg-[#0b071d] flex">

      {/* LEFT SIDEBAR */}
      <div className="hidden xl:flex">
        <LeftSidebar />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 xl:p-10 pb-28 xl:pb-10 overflow-y-auto">
        {children}
      </main>

      {/* RIGHT SIDEBAR */}
      <div className="hidden xl:flex">
        <RightSidebar />
      </div>

      {/* MOBILE NAV */}
      <MobileBottomNav />

    </div>
  );
}