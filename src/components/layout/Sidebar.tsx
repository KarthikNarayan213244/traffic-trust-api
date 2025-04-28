
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  Car,
  Map,
  Radio,
  Shield,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

type NavItem = {
  name: string;
  route: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { name: "Dashboard", route: "/", icon: BarChart2 },
  { name: "Vehicles", route: "/vehicles", icon: Car },
  { name: "RSUs", route: "/rsus", icon: Radio },
  { name: "Anomalies", route: "/anomalies", icon: AlertTriangle },
  { name: "Trust Ledger", route: "/trust-ledger", icon: Shield },
];

interface SidebarProps {
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  toggleMobileSidebar,
}) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transition-transform duration-300 lg:relative lg:z-0 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h2 className="text-lg font-medium text-primary">
            Traffic Trust API
          </h2>
          <button
            onClick={toggleMobileSidebar}
            className="p-2 lg:hidden text-gray-500 hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.route}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    location.pathname === item.route
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
