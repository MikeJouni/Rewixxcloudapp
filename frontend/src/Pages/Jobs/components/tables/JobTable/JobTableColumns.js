import React from "react";

const JobTableColumns = ({ 
  editingId, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onSaveEdit, 
  onCancelEdit 
}) => {
  const getStatusStyle = (status) => {
    if (status === "IN_PROGRESS") {
      return {
        backgroundColor: '#EFF6FF',
        color: '#1E40AF',
        border: '1px solid #BFDBFE'
      };
    }
    return {
      backgroundColor: '#ECFDF5',
      color: '#047857',
      border: '1px solid #A7F3D0'
    };
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'In Progress', value: 'IN_PROGRESS' },
        { text: 'Completed', value: 'COMPLETED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span 
          style={{
            ...getStatusStyle(status),
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: status === "IN_PROGRESS" ? '#3B82F6' : '#10B981',
            display: 'inline-block'
          }} />
          {status === "IN_PROGRESS" ? "In Progress" : "Completed"}
        </span>
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
            className="px-3 py-1 rounded text-sm bg-yellow-500 text-white hover:bg-yellow-600"
            onClick={() => onEdit(record)}
            title="Edit job"
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
