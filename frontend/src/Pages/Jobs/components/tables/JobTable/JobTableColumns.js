import React from "react";
import { EyeOutlined, EditOutlined, EnvironmentOutlined, DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';

// Helper function to open map with native app selection
const openMapNavigation = (address) => {
  if (!address) {
    alert("No work site address available for this job.");
    return;
  }

  const encodedAddress = encodeURIComponent(address);
  
  // Detect if iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Use a universal link approach
  // On iOS, this will show native app picker if multiple map apps installed
  // On Android, this will open the browser's app picker
  // On desktop, opens in new tab
  const link = document.createElement('a');
  link.href = isIOS 
    ? `https://maps.apple.com/?daddr=${encodedAddress}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const JobTableColumns = ({
  editingId,
  onViewDetails,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onCreateInvoice
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
      const totalPaid = Array.isArray(job.payments) && job.payments.length > 0
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
      title: 'Job Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'In Progress', value: 'IN_PROGRESS' },
        { text: 'Completed', value: 'COMPLETED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
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
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      filters: [
        { text: 'Unpaid', value: 'UNPAID' },
        { text: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { text: 'Paid', value: 'PAID' },
      ],
      onFilter: (value, record) => calculatePaymentStatus(record) === value,
      render: (_, record) => {
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
      },
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
      width: 320,
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
               onClick={() => onViewDetails(record)}>
            <div className="w-12 h-12 flex items-center justify-center">
              <EyeOutlined className="text-blue-600 text-2xl" />
            </div>
            <span className="text-xs text-gray-600 font-medium">View</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
               onClick={() => onEdit(record)}>
            <div className="w-12 h-12 flex items-center justify-center">
              <EditOutlined className="text-yellow-600 text-2xl" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Edit</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
               onClick={() => onCreateInvoice(record)}>
            <div className="w-12 h-12 flex items-center justify-center">
              <FileDoneOutlined className="text-purple-600 text-2xl" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Invoice</span>
          </div>

          {record.workSiteAddress && (
            <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
                 onClick={() => openMapNavigation(record.workSiteAddress)}>
              <div className="w-12 h-12 flex items-center justify-center">
                <EnvironmentOutlined className="text-green-600 text-2xl" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Map</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
               onClick={() => onDelete(record)}>
            <div className="w-12 h-12 flex items-center justify-center">
              <DeleteOutlined className="text-red-600 text-2xl" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Delete</span>
          </div>
        </div>
      ),
    },
  ];
};

export default JobTableColumns;
