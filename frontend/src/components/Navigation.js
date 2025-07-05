import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/customers" || path === "/") return "customers";
    if (path === "/jobs") return "jobs";
    if (path === "/reports") return "reports";
    return "customers";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="flex gap-4">
      <Link
        to="/customers"
        className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
          activeTab === "customers"
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-gray-600 text-gray-200 hover:bg-gray-700"
        }`}
      >
        Customers
      </Link>
      <Link
        to="/jobs"
        className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
          activeTab === "jobs"
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-gray-600 text-gray-200 hover:bg-gray-700"
        }`}
      >
        Jobs
      </Link>
      <Link
        to="/reports"
        className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
          activeTab === "reports"
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-gray-600 text-gray-200 hover:bg-gray-700"
        }`}
      >
        Reports
      </Link>
    </nav>
  );
};

export default Navigation;
