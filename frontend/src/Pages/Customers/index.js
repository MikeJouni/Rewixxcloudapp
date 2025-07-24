import React, { useState } from "react";
import CustomerForm from "./components/forms/CustomerForm";
import CustomerTable from "./components/tables/CustomerTable";
import useCustomers from "./hooks/useCustomers";

const CustomersPage = () => {
  const {
    customers,
    searchTerm,
    setSearchTerm,
    editingCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    startEditing,
    cancelEditing,
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,
  } = useCustomers();

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
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
              updateCustomer.mutate({ ...customerData, id: editingCustomer.id }, {
                onSuccess: () => {
                  cancelEditing();
                  setShowAddForm(false);
                },
              });
            } else {
              addCustomer.mutate(customerData, {
                onSuccess: () => setShowAddForm(false),
              });
            }
          }}
          onCancel={() => {
            setShowAddForm(false);
            cancelEditing();
          }}
          initialData={editingCustomer}
          isLoading={addCustomer.isLoading || updateCustomer.isLoading}
          error={addCustomer.error || updateCustomer.error}
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

      {/* Loading/Error States */}
      {isLoading && <p className="text-center text-gray-500">Loading customers...</p>}
      {error && <p className="text-center text-red-500">Error loading customers.</p>}

      {/* Customers Table */}
      <CustomerTable
        customers={customers}
        onEdit={startEditing}
        onDelete={(id) => deleteCustomer.mutate(id)}
        isDeleting={deleteCustomer.isLoading}
        deleteError={deleteCustomer.error}
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">Rows per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
