import React from "react";
import { Table, Button, Popconfirm, Space } from "antd";
import { useNavigate } from "react-router-dom";

const CustomerTable = ({ customers, onDelete }) => {
  const navigate = useNavigate();

  if (!customers || customers.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        No customers found matching your search.
      </p>
    );
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Address",
      key: "address",
      render: (_, customer) => (
        <>
          {[customer.addressLine1, customer.addressLine2].filter(Boolean).join(", ")}
          <br />
          {[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, customer) => (
        <Space>
      <Button
          size="small"
          style={{
            backgroundColor: "#6b7280",
            color: "#fff",
            border: "none",
            padding: "2px 8px",
            fontSize: "12px",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4b5563"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6b7280"}
          onClick={() => navigate(`/customers/${customer.id}`)}
        >
          Edit
        </Button>
          <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={() => onDelete(customer.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger type="primary" size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={customers}
      rowKey="id"
      pagination={false}
    />
  );
};

export default CustomerTable;
