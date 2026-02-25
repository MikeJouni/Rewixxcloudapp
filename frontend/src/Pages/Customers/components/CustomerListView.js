import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerTable from "./tables/CustomerTable";
import useCustomers from "../hooks/useCustomers";

const CustomerListView = () => {
  const navigate = useNavigate();
  const { deleteCustomer, error } = useCustomers();

  const handleDelete = (id) => {
    deleteCustomer.mutate(id);
  };

  return (
    <div className="p-4 sm:p-6 w-full h-full overflow-hidden">
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

      {/* Error State */}
      {error && (
        <p className="text-center text-red-500 mb-6">
          Error loading customers.
        </p>
      )}

      {/* Customers Table Container */}
      <div className="w-full overflow-x-auto">
        <CustomerTable onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default CustomerListView;
