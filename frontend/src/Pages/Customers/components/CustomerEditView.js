import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerForm from "./forms/CustomerForm";
import useCustomers from "../hooks/useCustomers";
import { useCustomerDetails } from "../hooks/useCustomers";

const CustomerEditView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateCustomer } = useCustomers();
  const { data: customer, isLoading: loadingCustomer } = useCustomerDetails(id);

  const handleCancel = () => {
    navigate("/customers");
  };

  if (loadingCustomer) {
    return (
      <div className="p-4 sm:p-6 w-full h-full">
        <p className="text-center text-gray-500 mt-8">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 sm:p-6 w-full h-full">
        <p className="text-center text-red-500 mt-8">Customer not found.</p>
        <div className="text-center mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={handleCancel}
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Edit Customer
        </h1>
        <button
          className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Edit Customer Details</h2>
        <CustomerForm
          initialData={customer}
          onSubmit={(customerData) => {
            updateCustomer.mutate(
              { id: customer.id, ...customerData },
              {
                onSuccess: () => navigate("/customers"),
              }
            );
          }}
          onCancel={handleCancel}
          isLoading={updateCustomer.isLoading}
          error={updateCustomer.error}
        />
      </div>
    </div>
  );
};

export default CustomerEditView;
