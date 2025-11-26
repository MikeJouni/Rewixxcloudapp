import React, { useState } from "react";
import { Table, Button, Input, Space } from "antd";
import CustomerForm from "../forms/CustomerForm";

const CustomerTable = ({ customers, onDelete, onUpdate }) => {
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);



  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setUpdateError(null);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setUpdateError(null);
  };

  const handleSaveEdit = async (formData) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await onUpdate({ id: editingCustomer.id, ...formData });
      setEditingCustomer(null);
    } catch (error) {
      console.error("Failed to update customer:", error);
      setUpdateError(error);
    } finally {
      setIsUpdating(false);
    }
  };


  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'username',
      key: 'username',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by email"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button 
              onClick={() => {
                clearFilters();
                confirm();
              }} 
              size="small" 
              style={{ width: 90 }}
              disabled={!selectedKeys[0]}
            >
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => record.username.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by phone"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button 
              onClick={() => {
                clearFilters();
                confirm();
              }} 
              size="small" 
              style={{ width: 90 }}
              disabled={!selectedKeys[0]}
            >
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        // Remove all non-digit characters from both the search value and record phone
        const searchDigits = value.replace(/\D/g, '');
        const recordDigits = record.phone.replace(/\D/g, '');
        return recordDigits.includes(searchDigits);
      },
    },
    {
      title: 'Address',
      key: 'address',
      render: (_, record) => (
        <div>
          <div>{[record.addressLine1, record.addressLine2].filter(Boolean).join(", ")}</div>
          <div className="text-gray-500 text-sm">
            {[record.city, record.state, record.zip].filter(Boolean).join(", ")}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            onClick={() => handleEdit(record)}
          >
            Edit
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            onClick={() => onDelete(record)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          defaultSortOrder="descend"
          sortDirections={['descend', 'ascend']}
          className="responsive-table"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {customers && customers.length > 0 ? (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header with ID and Name */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ID: {customer.id}</div>
                    <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Email</div>
                  <div className="text-sm text-gray-900">{customer.username}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Phone</div>
                  <div className="text-sm text-gray-900">{customer.phone}</div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Address</div>
                <div className="text-sm text-gray-900">
                  {[customer.addressLine1, customer.addressLine2].filter(Boolean).join(", ")}
                </div>
                <div className="text-sm text-gray-500">
                  {[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(customer)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No customers found</div>
        )}
      </div>

      {/* Edit Form Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Customer</h3>
              <button
                onClick={handleCancelEdit}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleSaveEdit}
              onCancel={handleCancelEdit}
              isLoading={isUpdating}
              error={updateError}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerTable;
