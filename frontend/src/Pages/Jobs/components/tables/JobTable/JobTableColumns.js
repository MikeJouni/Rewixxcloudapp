import React from "react";
import { Tag } from "antd";

const JobTableColumns = ({ 
  editingId, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onSaveEdit, 
  onCancelEdit 
}) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW": return "green";
      case "MEDIUM": return "orange";
      case "HIGH": return "red";
      case "URGENT": return "magenta";
      default: return "default";
    }
  };

  const getStatusColor = (status) => {
    return status === "IN_PROGRESS" ? "processing" : "success";
  };

  const computeTotalCost = (job) => {
    try {
      if (!job) return 0;
      if (typeof job.totalCost === 'number') return job.totalCost;
      if (job.total_cost) return Number(job.total_cost) || 0;
      // Fallback: compute from sales if present
      if (Array.isArray(job.sales)) {
        return job.sales.reduce((sum, sale) => {
          if (!sale || !Array.isArray(sale.saleItems)) return sum;
          const saleTotal = sale.saleItems.reduce((st, item) => {
            const unit = Number(item?.unitPrice ?? item?.product?.unitPrice ?? 0) || 0;
            const qty = Number(item?.quantity ?? 0) || 0;
            return st + unit * qty;
          }, 0);
          return sum + saleTotal;
        }, 0);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  return [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => {
        const aName = a.customerName || a.customer?.name || a.customer?.username || "";
        const bName = b.customerName || b.customer?.name || b.customer?.username || "";
        return aName.localeCompare(bName);
      },
      render: (_, record) => record.customerName || record.customer?.name || record.customer?.username || "Unknown Customer",
    },
    {
      title: 'Job Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      filters: [
        { text: 'Low', value: 'LOW' },
        { text: 'Medium', value: 'MEDIUM' },
        { text: 'High', value: 'HIGH' },
        { text: 'Urgent', value: 'URGENT' },
      ],
      onFilter: (value, record) => record.priority === value,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.charAt(0) + priority.slice(1).toLowerCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'In Progress', value: 'IN_PROGRESS' },
        { text: 'Completed', value: 'COMPLETED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === "IN_PROGRESS" ? "In Progress" : "Completed"}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : "N/A",
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : "N/A",
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      sorter: (a, b) => computeTotalCost(a) - computeTotalCost(b),
      render: (_, record) => `$${computeTotalCost(record).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onClick={() => onViewDetails(record)}
          >
            View
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${record.status === "COMPLETED" ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-yellow-500 text-white hover:bg-yellow-600"}`}
            onClick={() => record.status !== "COMPLETED" && onEdit(record)}
            disabled={record.status === "COMPLETED"}
            title={record.status === "COMPLETED" ? "Completed jobs cannot be edited" : "Edit job"}
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
};

export default JobTableColumns;
