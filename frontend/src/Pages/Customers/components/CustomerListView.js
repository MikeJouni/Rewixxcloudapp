import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerTable from "./tables/CustomerTable";
import useCustomers from "../hooks/useCustomers";

const CustomerListView = () => {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, deleteCustomer, error } = useCustomers();

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
          onClick={() => navigate("/customers/create")}
        >
          Add New Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error State */}
      {error && (
        <p className="text-center text-red-500">Error loading customers.</p>
      )}

      {/* Customers Table */}
      <CustomerTable onDelete={handleDelete} />
    </div>
  );
};

export default CustomerListView;
