import React, { useState, useEffect } from "react";
import { Table, Tag } from "antd";
import { EyeOutlined, EditOutlined, EnvironmentOutlined, DeleteOutlined } from "@ant-design/icons";
import * as customerService from "../../../../Customers/services/customerService";
import JobTableColumns from "./JobTableColumns";
import JobEditModal from "./JobEditModal";
import JobDeleteConfirm from "./JobDeleteConfirm";

const JobTable = ({
  jobs,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState({});
  const [jobToDelete, setJobToDelete] = useState(null);

  // Fetch customers when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getCustomersList();
        setCustomers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleEdit = (job) => {
    setEditingId(job.id);
    setEditFormData({
      customerId: job.customer?.id || "",
      title: job.title || "",
      description: job.description || "",
      workSiteAddress: job.workSiteAddress || "",
    });
    // Pre-fill the customer search with the current customer's name
    setCustomerSearchTerm(job.customer?.name || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setShowCustomerDropdown({});
  };

  const handleSaveEdit = async (jobId) => {
    try {
      await onEdit({ ...editFormData, id: jobId });
      setEditingId(null);
      setEditFormData({});
      setShowCustomerDropdown({});
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleCustomerSearch = (jobId, searchTerm) => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers([]);
    } else {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  };

  const selectCustomer = (jobId, customer) => {
    setEditFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    // Update the search term to show the selected customer's name
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(prev => ({ ...prev, [jobId]: false }));
  };

  const columns = JobTableColumns({
    editingId,
    onViewDetails,
    onEdit: handleEdit,
    onDelete: setJobToDelete,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: handleCancelEdit
  });

  // Helper functions for mobile view
  const calculatePaymentStatus = (job) => {
    try {
      if (!job) return "UNPAID";
      const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null
        ? Number(job.customMaterialCost)
        : 0;
      const jobPrice = Number(job.jobPrice) || 0;
      const subtotal = billingMaterialCost + jobPrice;
      const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
      const totalCost = subtotal + taxAmount;
      const totalPaid = job.payments && job.payments.length > 0
        ? job.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
        : 0;
      if (totalPaid === 0) return "UNPAID";
      else if (totalPaid >= totalCost) return "PAID";
      else return "PARTIALLY_PAID";
    } catch (e) {
      return "UNPAID";
    }
  };

  const computeTotalCost = (job) => {
    try {
      if (!job) return 0;
      const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null
        ? Number(job.customMaterialCost)
        : 0;
      const jobPrice = Number(job.jobPrice) || 0;
      const subtotal = billingMaterialCost + jobPrice;
      const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
      return subtotal + taxAmount;
    } catch (e) {
      return 0;
    }
  };

  const openMapNavigation = (address) => {
    if (!address) {
      alert("No work site address available for this job.");
      return;
    }
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          defaultSortOrder="descend"
          sortDirections={['descend', 'ascend']}
          className="responsive-table"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => {
            const paymentStatus = calculatePaymentStatus(job);
            const totalCost = computeTotalCost(job);
            const customerName = job.customerName || job.customer?.name || job.customer?.username || "Unknown Customer";

            return (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                {/* Header with ID, Status Tags */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-500">Job #{job.id}</div>
                      <div className="text-lg font-semibold text-gray-900 mt-1">{job.title}</div>
                    </div>
                    <div className="text-right text-lg font-bold text-gray-900">
                      ${totalCost.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Job Status */}
                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                      job.status === "IN_PROGRESS"
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {job.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
                    </span>
                    {/* Payment Status */}
                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                      paymentStatus === "PAID"
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : paymentStatus === "PARTIALLY_PAID"
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {paymentStatus === "PAID" ? "Paid" : paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">Customer</div>
                  <div className="text-sm font-medium text-gray-900">{customerName}</div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Start Date</div>
                    <div className="text-sm text-gray-900">
                      {job.startDate ? new Date(job.startDate).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">End Date</div>
                    <div className="text-sm text-gray-900">
                      {job.endDate ? new Date(job.endDate).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onViewDetails(job)}
                    className="flex flex-col items-center justify-center py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <EyeOutlined className="text-xl mb-1" />
                    <span className="text-xs font-medium">View</span>
                  </button>
                  <button
                    onClick={() => handleEdit(job)}
                    className="flex flex-col items-center justify-center py-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 transition-colors"
                  >
                    <EditOutlined className="text-xl mb-1" />
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  {job.workSiteAddress && (
                    <button
                      onClick={() => openMapNavigation(job.workSiteAddress)}
                      className="flex flex-col items-center justify-center py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                    >
                      <EnvironmentOutlined className="text-xl mb-1" />
                      <span className="text-xs font-medium">Map</span>
                    </button>
                  )}
                  <button
                    onClick={() => setJobToDelete(job)}
                    className="flex flex-col items-center justify-center py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <DeleteOutlined className="text-xl mb-1" />
                    <span className="text-xs font-medium">Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">No jobs found</div>
        )}
      </div>

      <JobDeleteConfirm
        job={jobToDelete}
        onCancel={() => setJobToDelete(null)}
        onConfirm={(id) => {
          onDelete(id);
          setJobToDelete(null);
        }}
      />

      <JobEditModal
        isOpen={!!editingId}
        editingId={editingId}
        editFormData={editFormData}
        customers={customers}
        filteredCustomers={filteredCustomers}
        customerSearchTerm={customerSearchTerm}
        showCustomerDropdown={showCustomerDropdown[editingId]}
        onClose={handleCancelEdit}
        onInputChange={handleInputChange}
        onCustomerSearch={handleCustomerSearch}
        onCustomerSelect={selectCustomer}
        onSaveEdit={handleSaveEdit}
        onDropdownToggle={(show) => setShowCustomerDropdown(prev => ({ ...prev, [editingId]: show }))}
      />
    </>
  );
};

export default JobTable;
