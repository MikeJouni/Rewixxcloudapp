import React from "react";
import { Table, Button, Popconfirm, Space, Tag } from "antd";

const JobTable = ({
  jobs,
  onViewDetails,
  onEdit,
  onDelete,
  onReceiptUpload,
  processingReceipt = false,
  isMobile = false,
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">No jobs found matching your criteria.</p>
    );
  }

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : status === "In Progress"
              ? "bg-blue-100 text-blue-800"
              : status === "Completed"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <span
          className={`font-semibold ${
            priority === "Low"
              ? "text-green-600"
              : priority === "Medium"
              ? "text-yellow-600"
              : priority === "High"
              ? "text-orange-600"
              : "text-red-600"
          }`}
        >
          {priority}
        </span>
      ),
    },
    { title: "Start Date", dataIndex: "startDate", key: "startDate" },
    { title: "End Date", dataIndex: "endDate", key: "endDate" },
    {
      title: "Hours (Est/Act)",
      key: "hours",
      render: (_, job) => `${job.estimatedHours} / ${job.actualHours}`,
    },
    {
      title: "Total Cost",
      key: "totalCost",
      render: (_, job) => `$${job.totalCost?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Receipts",
      key: "receipts",
      render: (_, job) => (
        <span className="text-sm text-gray-500">
          {job.receipts ? job.receipts.length : 0} attached
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, job) => (
        <div className="flex gap-1 flex-wrap">
         <Button
            size="small"
            style={{ backgroundColor: "#6b7280", color: "#fff", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6b7280")}
            onClick={() => onEdit(job)}
          >
            Edit
          </Button>

          <Button
            size="small"
            style={{ backgroundColor: "#2563eb", color: "#fff", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            onClick={() => onViewDetails(job)}
          >
            View
          </Button>
          {isMobile && (
            <label
              className={`px-2 py-1 text-xs text-white border-none rounded cursor-pointer ${
                processingReceipt
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {processingReceipt ? "Processing..." : "Attach Receipt"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onReceiptUpload(job.id, e)}
                className="hidden"
                disabled={processingReceipt}
              />
            </label>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      rowKey="id"
      pagination={false}
      onRow={(job) => ({
        onClick: () => onViewDetails(job),
      })}
      className="bg-white rounded-lg shadow"
    />
  );
};

export default JobTable;
