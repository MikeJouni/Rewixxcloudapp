import React, { useEffect, useState } from "react";
import { Button, Input, Spin } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import ConfirmModal from "../../../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import CustomerTable from "./tables/CustomerTable";
import useCustomers from "../hooks/useCustomers";

const CustomerListView = () => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const {
    customers,
    searchTerm,
    setSearchTerm,
    deleteCustomer,
    updateCustomer,
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

  const handleDelete = (customer) => {
    if (isDeleting) return;
    setCustomerToDelete(customer);
  };

  // Reset page to 0 when search term or pageSize changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, pageSize, setPage]);

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/customers/create")}
          className="w-full sm:w-auto"
          style={{ 
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', 
            border: 'none',
          }}
        >
          Add New Customer
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <Input
          size="large"
          placeholder="Search customers by name..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Loading/Error States */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-3 text-gray-600 text-lg">Loading customers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500 text-lg">
          Error loading customers.
        </div>
      ) : null}

      {!isLoading && !error && (

        <>
          {/* Customers Table - Responsive Container */}
          <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
            <CustomerTable
              customers={customers}
              onDelete={handleDelete}
              onUpdate={updateCustomer.mutateAsync}
              isDeleting={deleteCustomer.isLoading || isDeleting}
              deleteError={deleteCustomer.error}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevious}
                size="small"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={!hasNext}
                size="small"
              >
                Next
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPage(0);
                  setPageSize(Number(e.target.value));
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Modal */}
          <ConfirmModal
            isOpen={!!customerToDelete}
            title="Delete Customer"
            message={customerToDelete ? `This will permanently delete customer "${customerToDelete.name}" and cannot be undone.` : ""}
            confirmLabel="Delete Customer"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
            onCancel={() => setCustomerToDelete(null)}
            onConfirm={() => {
              if (!customerToDelete) return;
              setIsDeleting(true);
              deleteCustomer.mutate(customerToDelete.id, {
                onSettled: () => {
                  setIsDeleting(false);
                  setCustomerToDelete(null);
                }
              });
            }}
            requireTextMatch={customerToDelete ? {
              expected: customerToDelete.name,
              placeholder: customerToDelete.name,
              help: `Type the customer's name to confirm: ${customerToDelete.name}`,
            } : null}
          />
        </>
      )}
    </div>
  );
};

export default CustomerListView;
