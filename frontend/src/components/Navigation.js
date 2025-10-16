import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  UserOutlined, 
  ToolOutlined, 
  BarChartOutlined
} from "@ant-design/icons";

const Navigation = () => {
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/customers") || path === "/") return "customers";
    if (path.startsWith("/jobs")) return "jobs";
    if (path.startsWith("/reports")) return "reports";
    return "customers";
  };

  const activeTab = getActiveTab();

  const navItems = [
    {
      key: "customers",
      path: "/customers",
      label: "Customers",
      icon: <UserOutlined className="text-lg" />,
      description: "Manage clients"
    },
    {
      key: "jobs",
      path: "/jobs",
      label: "Jobs",
      icon: <ToolOutlined className="text-lg" />,
      description: "Track projects"
    },
    {
      key: "reports",
      path: "/reports",
      label: "Reports",
      icon: <BarChartOutlined className="text-lg" />,
      description: "View analytics"
    }
  ];

  return (
    <nav className="w-full">
      <div className="flex bg-gray-900 rounded-2xl p-2 shadow-lg border border-gray-700">
        {navItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`flex-1 group relative overflow-hidden rounded-xl transition-all duration-300 ease-out ${
              activeTab === item.key
                ? "bg-white text-gray-900 shadow-lg transform scale-105"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex flex-col items-center justify-center px-4 py-4 sm:py-5">
              <div className={`transition-all duration-300 ${
                activeTab === item.key 
                  ? "text-blue-600 transform scale-110" 
                  : "group-hover:scale-110"
              }`}>
                {item.icon}
              </div>
              <span className={`font-semibold text-sm sm:text-base mt-2 transition-all duration-300 ${
                activeTab === item.key ? "text-gray-900" : "text-white/90"
              }`}>
                {item.label}
              </span>
              <span className={`text-xs mt-1 transition-all duration-300 ${
                activeTab === item.key 
                  ? "text-gray-600" 
                  : "text-white/60 group-hover:text-white/80"
              }`}>
                {item.description}
              </span>
            </div>
            
            {/* Active indicator */}
            {activeTab === item.key && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full"></div>
            )}
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
