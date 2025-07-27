import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm from "./forms/CustomerForm";
import useCustomers from "../hooks/useCustomers";

const CustomerCreateView = () => {
  const navigate = useNavigate();
  const { addCustomer } = useCustomers();

  const handleCreateSuccess = (response) => {
    // Navigate to the newly created customer's detail page
    navigate(`/customers/${response.id}`);
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Create New Customer
        </h1>
        <button
          className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      <CustomerForm
        onSubmit={(customerData) => {
          addCustomer.mutate(customerData, {
            onSuccess: handleCreateSuccess,
          });
        }}
        onCancel={handleCancel}
        isLoading={addCustomer.isLoading}
        error={addCustomer.error}
      />
    </div>
  );
};

export default CustomerCreateView;
