import React, { useState } from "react";
import CustomerForm from "./components/forms/CustomerForm";
import CustomerTable from "./components/tables/CustomerTable";
import useCustomers from "./hooks/useCustomers";

const CustomersPage = () => {
  const {
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    editingCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    startEditing,
    cancelEditing,
  } = useCustomers();

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New Customer"}
        </button>
      </div>

      {/* Add/Edit Customer Form */}
      {(showAddForm || editingCustomer) && (
        <CustomerForm
          onSubmit={(customerData) => {
            if (editingCustomer) {
              updateCustomer({ ...customerData, id: editingCustomer.id });
            } else {
              addCustomer(customerData);
              setShowAddForm(false);
            }
          }}
          onCancel={() => {
            setShowAddForm(false);
            cancelEditing();
          }}
          initialData={editingCustomer}
        />
      )}

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

      {/* Customers Table */}
      <CustomerTable
        customers={filteredCustomers}
        onEdit={startEditing}
        onDelete={deleteCustomer}
      />
    </div>
  );
};

export default CustomersPage;