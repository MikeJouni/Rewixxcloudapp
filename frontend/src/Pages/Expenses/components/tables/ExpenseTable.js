import React from "react";
import { Table, Button, Tag, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const ExpenseTable = ({ expenses, onEdit, onDelete, isLoading }) => {
  const EXPENSE_TYPE_COLORS = {
    LABOR: "blue",
    MATERIAL: "green",
    EQUIPMENT: "orange",
    VEHICLE: "purple",
    SUBCONTRACTOR: "cyan",
    PERMIT: "magenta",
    INSURANCE: "red",
    UTILITIES: "volcano",
    TRAVEL: "geekblue",
    OFFICE: "lime",
    MARKETING: "gold",
    OTHER: "default",
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type) => (
        <Tag color={EXPENSE_TYPE_COLORS[type] || "default"}>
          {type.replace(/_/g, " ")}
        </Tag>
      ),
      filters: Object.keys(EXPENSE_TYPE_COLORS).map(type => ({
        text: type.replace(/_/g, " "),
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text, record) => (
        <div>
          {record.employeeName && (
            <div className="font-medium text-blue-600">{record.employeeName}</div>
          )}
          {text || <span className="text-gray-400">No description</span>}
          {record.hoursWorked && (
            <div className="text-xs text-gray-500">
              {record.hoursWorked}h {record.hourlyRate && `@ $${record.hourlyRate}/hr`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Job",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 150,
      ellipsis: true,
      render: (title, record) => title ? (
        <span className="text-blue-600">#{record.jobId} - {title}</span>
      ) : (
        <span className="text-gray-400">General</span>
      ),
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      key: "vendor",
      width: 120,
      ellipsis: true,
      render: (vendor) => vendor || <span className="text-gray-400">—</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      align: "right",
      render: (amount) => (
        <span className="font-semibold text-gray-900">
          ${parseFloat(amount).toFixed(2)}
        </span>
      ),
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: "Billable",
      dataIndex: "billable",
      key: "billable",
      width: 100,
      align: "center",
      render: (billable) => billable ? (
        <Tag color="green">Yes</Tag>
      ) : (
        <Tag color="red">No</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.id)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={expenses}
      rowKey="id"
      loading={isLoading}
      pagination={false}
      scroll={{ x: 1200 }}
    />
  );
};

export default ExpenseTable;
