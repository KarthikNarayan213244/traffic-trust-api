
import React from "react";
import { Bell, User, Menu } from "lucide-react";

interface NavbarProps {
  toggleMobileSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleMobileSidebar }) => {
  return (
    <header className="bg-white shadow h-16 flex items-center px-4">
      <button
        onClick={toggleMobileSidebar}
        className="p-2 mr-2 lg:hidden text-gray-500 hover:text-primary"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:text-primary relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
