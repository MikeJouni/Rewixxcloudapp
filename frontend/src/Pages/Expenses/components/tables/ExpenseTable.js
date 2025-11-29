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
      width: 110,
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
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
      width: 260,
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
      width: 140,
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
      width: 110,
      ellipsis: true,
      render: (vendor) => vendor || <span className="text-gray-400">—</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 110,
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
      width: 90,
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
      width: 130,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(record)}
            className="px-2 py-1 bg-gray-700 text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <EditOutlined />
            Edit
          </button>
          <button
            onClick={() => onDelete(record.id)}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <DeleteOutlined />
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
          dataSource={expenses}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : expenses && expenses.length > 0 ? (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header with Type and Amount */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                <div>
                  <Tag color={EXPENSE_TYPE_COLORS[expense.type] || "default"} className="mb-1">
                    {expense.type.replace(/_/g, " ")}
                  </Tag>
                  <div className="text-xs text-gray-500">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </div>
                  <Tag color={expense.billable ? "green" : "red"} className="mt-1">
                    {expense.billable ? "Billable" : "Non-Billable"}
                  </Tag>
                </div>
              </div>

              {/* Description & Employee */}
              {expense.employeeName && (
                <div className="mb-2">
                  <span className="text-xs text-gray-600">Employee:</span>
                  <div className="font-medium text-blue-600">{expense.employeeName}</div>
                </div>
              )}

              {expense.description && (
                <div className="mb-2">
                  <span className="text-xs text-gray-600">Description:</span>
                  <div className="text-sm text-gray-900">{expense.description}</div>
                </div>
              )}

              {expense.hoursWorked && (
                <div className="mb-2">
                  <span className="text-xs text-gray-600">Hours:</span>
                  <div className="text-sm text-gray-900">
                    {expense.hoursWorked}h {expense.hourlyRate && `@ $${expense.hourlyRate}/hr`}
                  </div>
                </div>
              )}

              {/* 2-Column Grid for Job and Vendor */}
              <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Job</div>
                  {expense.jobTitle ? (
                    <div className="text-sm text-blue-600">#{expense.jobId} - {expense.jobTitle}</div>
                  ) : (
                    <div className="text-sm text-gray-400">General</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Vendor</div>
                  <div className="text-sm text-gray-900">{expense.vendor || "—"}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onEdit(expense)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <EditOutlined />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <DeleteOutlined />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No expenses found</div>
        )}
      </div>
    </>
  );
};

export default ExpenseTable;
