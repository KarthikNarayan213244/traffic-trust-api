
// If this file doesn't exist, here's a placeholder:
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Car, Radio, AlertTriangle, Database, Settings, Home } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 bg-white border-r flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">Traffic Trust Platform</h1>
          <div className="text-xs text-muted-foreground">Infrastructure Security</div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                to="/"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/vehicles"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/vehicles') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Car className="h-4 w-4" />
                <span>Vehicles</span>
              </Link>
            </li>
            <li>
              <Link
                to="/rsus"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/rsus') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Radio className="h-4 w-4" />
                <span>RSUs</span>
              </Link>
            </li>
            <li>
              <Link
                to="/anomalies"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/anomalies') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Anomalies</span>
              </Link>
            </li>
            <li className="pt-2 pb-1">
              <div className="text-xs font-medium uppercase text-muted-foreground px-3 py-1">
                Trust Ledger
              </div>
            </li>
            <li>
              <Link
                to="/trust-ledger"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/trust-ledger') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Vehicle Trust</span>
              </Link>
            </li>
            <li>
              <Link
                to="/rsu-trust-ledger"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/rsu-trust-ledger') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>RSU Trust</span>
              </Link>
            </li>
            <li className="mt-auto">
              <Link
                to="/settings"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm ${
                  isActive('/settings') ? 'bg-gray-100 text-primary font-medium' : 'text-muted-foreground hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
