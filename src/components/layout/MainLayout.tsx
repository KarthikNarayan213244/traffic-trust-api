
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showSidebar = true,
  showNavbar = true,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {showSidebar && (
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showNavbar && <Navbar toggleMobileSidebar={toggleMobileSidebar} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
