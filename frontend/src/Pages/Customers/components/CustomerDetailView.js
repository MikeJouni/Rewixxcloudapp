import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerForm from "./forms/CustomerForm";
import useCustomers, { useCustomerDetails } from "../hooks/useCustomers";

const CustomerDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { updateCustomer } = useCustomers();
  const getCustomerById = useCustomerDetails(id);

  const customer = getCustomerById.data;

  if (getCustomerById.isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full h-full">
        <p className="text-center text-gray-500">Loading customer...</p>
      </div>
    );
  }

  if (getCustomerById.error) {
    return (
      <div className="p-4 sm:p-6 w-full h-full">
        <p className="text-center text-red-500">Error loading customer.</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 sm:p-6 w-full h-full">
        <p className="text-center text-gray-500">Customer not found.</p>
      </div>
    );
  }

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    // Refresh the customer data
    getCustomerById.refetch();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Customer Details
        </h1>
        <div className="flex gap-2">
          <button
            className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
            onClick={() => navigate("/customers")}
          >
            Back to List
          </button>
          {!isEditing && (
            <button
              className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
              onClick={() => setIsEditing(true)}
            >
              Edit Customer
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <CustomerForm
          onSubmit={(customerData) => {
            updateCustomer.mutate(
              { ...customerData, id: customer.id },
              {
                onSuccess: handleUpdateSuccess,
              }
            );
          }}
          onCancel={handleCancel}
          initialData={customer}
          isLoading={updateCustomer.isLoading}
          error={updateCustomer.error}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    ID
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.id}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Name
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.name}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Email
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.username}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Phone
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.phone}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Address Line 1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.addressLine1}
                  </td>
                </tr>
                {customer.addressLine2 && (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Address Line 2
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.addressLine2}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    City
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.city}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    State
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.state}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    ZIP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.zip}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailView;
