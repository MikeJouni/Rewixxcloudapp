import React, { useState } from "react";
import { Button, Input, Pagination, Select, Space, Card } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowAddForm(!showAddForm)}
          size="large"
        >
          {showAddForm ? "Cancel" : "Add New Customer"}
        </Button>
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
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          size="large"
          allowClear
        />
      </div>

      {/* Loading/Error States */}
      {isLoading && <p className="text-center text-gray-500">Loading customers...</p>}
      {error && <p className="text-center text-red-500">Error loading customers.</p>}

      {/* Customers Table */}
      <Card className="mb-4">
        <CustomerTable
          customers={customers}
          onEdit={startEditing}
          onDelete={(id) => deleteCustomer.mutate(id)}
          isLoading={isLoading}
          error={error}
        />
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
        <Pagination
          current={page + 1}
          total={totalPages * pageSize}
          pageSize={pageSize}
          onChange={(newPage) => setPage(newPage - 1)}
          showSizeChanger={false}
          showQuickJumper
          showTotal={(total, range) => 
            `${range[0]}-${range[1]} of ${total} customers`
          }
        />
        <Space>
          <span>Rows per page:</span>
          <Select
            value={pageSize}
            onChange={setPageSize}
            options={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
            style={{ width: 80 }}
          />
        </Space>
      </div>
    </div>
  );
};

export default CustomersPage;