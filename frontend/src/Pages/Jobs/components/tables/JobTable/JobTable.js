import React, { useState, useEffect } from "react";
import { Table } from "antd";
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
      priority: job.priority || "MEDIUM",
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

  const priorityOptions = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-orange-600" },
    { value: "URGENT", label: "Urgent", color: "text-red-600" }
  ];

  const columns = JobTableColumns({
    editingId,
    onViewDetails,
    onEdit: handleEdit,
    onDelete: setJobToDelete,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: handleCancelEdit
  });

  return (
    <div>
      <Table
        columns={columns}
        dataSource={jobs}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1200 }}
        size="small"
        defaultSortOrder="descend"
        sortDirections={['descend', 'ascend']}
      />
      
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
        priorityOptions={priorityOptions}
        onClose={handleCancelEdit}
        onInputChange={handleInputChange}
        onCustomerSearch={handleCustomerSearch}
        onCustomerSelect={selectCustomer}
        onSaveEdit={handleSaveEdit}
        onDropdownToggle={(show) => setShowCustomerDropdown(prev => ({ ...prev, [editingId]: show }))}
      />
    </div>
  );
};

export default JobTable;
