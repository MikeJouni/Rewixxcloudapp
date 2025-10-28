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

  const getPaymentStatusStyle = (status) => {
    if (status === "PAID") {
      return {
        backgroundColor: '#ECFDF5',
        color: '#047857',
        border: '1px solid #A7F3D0'
      };
    } else if (status === "PARTIALLY_PAID") {
      return {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FDE68A'
      };
    }
    return {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FECACA'
    };
  };

  const calculatePaymentStatus = (job) => {
    try {
      if (!job) return "UNPAID";

      // Calculate total cost same as computeTotalCost
      const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null
        ? Number(job.customMaterialCost)
        : 0;
      const jobPrice = Number(job.jobPrice) || 0;
      const subtotal = billingMaterialCost + jobPrice;
      const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
      const totalCost = subtotal + taxAmount;

      // Calculate total paid from payments
      const totalPaid = job.payments && job.payments.length > 0
        ? job.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
        : 0;

      if (totalPaid === 0) {
        return "UNPAID";
      } else if (totalPaid >= totalCost) {
        return "PAID";
      } else {
        return "PARTIALLY_PAID";
      }
    } catch (e) {
      return "UNPAID";
    }
  };

  const computeTotalCost = (job) => {
    try {
      if (!job) return 0;
      
      // Match the calculation in JobInfoSection:
      // Total = billingMaterialCost + jobPrice + tax
      const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null 
        ? Number(job.customMaterialCost) 
        : 0;
      const jobPrice = Number(job.jobPrice) || 0;
      const subtotal = billingMaterialCost + jobPrice;
      const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
      const totalCost = subtotal + taxAmount;
      
      return totalCost;
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
      render: (status, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          {(() => {
            const paymentStatus = calculatePaymentStatus(record);
            return (
              <span
                style={{
                  ...getPaymentStatusStyle(paymentStatus),
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
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
                  backgroundColor: paymentStatus === "PAID" ? '#10B981' : paymentStatus === "PARTIALLY_PAID" ? '#F59E0B' : '#EF4444',
                  display: 'inline-block'
                }} />
                {paymentStatus === "PAID" ? "Paid" : paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" : "Unpaid"}
              </span>
            );
          })()}
        </div>
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
