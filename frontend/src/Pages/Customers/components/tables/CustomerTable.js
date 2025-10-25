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
