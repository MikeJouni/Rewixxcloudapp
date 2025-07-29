import React from "react";
import { Table, Button, Space, Popconfirm, Tag } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";

const CustomerTable = ({
  customers,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  error = null,
}) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <a href={`mailto:${text}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </a>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: "Address",
      key: "address",
      render: (_, record) => {
        const addressParts = [
          record.addressLine1,
          record.addressLine2,
          record.city,
          record.state,
          record.zip,
        ].filter(Boolean);
        
        return addressParts.length > 0 ? (
          <div className="max-w-xs">
            <div className="text-sm">{addressParts.join(", ")}</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? "green" : "red"}>
          {enabled ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {onView && (
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            >
              View
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Customer"
            description="Are you sure you want to delete this customer? This action cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
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
      loading={isLoading}
      pagination={false} // We handle pagination in the parent component
      scroll={{ x: 1200 }}
      size="middle"
      className="bg-white rounded-lg shadow-sm"
    />
  );
};

export default CustomerTable;
