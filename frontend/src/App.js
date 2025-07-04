import React, { useState } from "react";
import "./index.css";
import CustomersPage from "./Pages/Customers";
import JobsPage from "./Pages/Jobs";
import ReportsPage from "./Pages/Reports";

function App() {
  const [activeTab, setActiveTab] = useState("customers");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "customers":
        return <CustomersPage />;
      case "jobs":
        return <JobsPage />;
      case "reports":
        return <ReportsPage />;
      default:
        return <CustomersPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-8 py-6 shadow-lg">
        <h1 className="text-3xl font-light mb-4">
          Cloud App/Electrician System
        </h1>
        <nav className="flex gap-4">
          <button
            className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
              activeTab === "customers"
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("customers")}
          >
            Customers
          </button>
          <button
            className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
              activeTab === "jobs"
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("jobs")}
          >
            Jobs
          </button>
          <button
            className={`px-6 py-3 rounded border-2 transition-all duration-300 hover:-translate-y-0.5 ${
              activeTab === "reports"
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">{renderActiveComponent()}</main>
    </div>
  );
}

export default App;
