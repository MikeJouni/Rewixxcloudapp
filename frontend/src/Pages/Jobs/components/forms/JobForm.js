import React, { useState, useEffect } from "react";
import * as customerService from "../../../Customers/services/customerService";

const JobForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData ? {
      customerId: initialData.customer?.id || "",
      title: initialData.title || "",
      description: initialData.description || "",
      status: initialData.status || "PENDING",
      priority: initialData.priority || "MEDIUM",
      startDate: initialData.startDate || "",
      endDate: initialData.endDate || "",
    } : {
      customerId: "",
      title: "",
      description: "",
      status: "PENDING",
      priority: "MEDIUM",
      startDate: "",
      endDate: "",
    }
  );

  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  const statusOptions = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (customerSearchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.username?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      console.log("Fetching customers...");
      const response = await customerService.getCustomersList({ pageSize: 1000 });
      console.log("Customers response:", response);
      if (response && response.customers) {
        setCustomers(response.customers);
        setFilteredCustomers(response.customers);
        console.log(`Fetched ${response.customers.length} customers for job form`);
      } else {
        console.warn("No customers found in response:", response);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields (non-blocking)
    if (!formData.title.trim()) {
      console.warn("Job title is required");
      return;
    }
    if (!formData.customerId) {
      console.warn("Please select a customer");
      return;
    }
    if (!formData.status) {
      console.warn("Please select a status");
      return;
    }
    if (!formData.priority) {
      console.warn("Please select a priority");
      return;
    }
    
    // Prepare data for submission
    const submissionData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description || "",
      // Convert empty strings to null for dates
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      // Ensure customerId is a number
      customerId: parseInt(formData.customerId)
    };
    
    console.log("Submitting job data:", submissionData);
    console.log("Customer ID type:", typeof submissionData.customerId);
    console.log("Title type:", typeof submissionData.title);
    console.log("Status type:", typeof submissionData.status);
    console.log("Priority type:", typeof submissionData.priority);
    console.log("Start date:", submissionData.startDate);
    console.log("End date:", submissionData.endDate);
    
    onSubmit(submissionData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomerSearch = (e) => {
    setCustomerSearchTerm(e.target.value);
    setShowCustomerDropdown(true);
  };

  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      customerId: customer.id
    });
    const customerDisplayName = customer.name || customer.username || "Unknown Customer";
    setSelectedCustomerName(customerDisplayName);
    setCustomerSearchTerm(customerDisplayName);
    setShowCustomerDropdown(false);
  };

  const handleCustomerInputFocus = () => {
    setShowCustomerDropdown(true);
  };

  const handleCustomerInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowCustomerDropdown(false), 200);
  };

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? "Edit Job" : "Add New Job"}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer *
          </label>
          <input
            type="text"
            value={customerSearchTerm}
            onChange={handleCustomerSearch}
            onFocus={handleCustomerInputFocus}
            onBlur={handleCustomerInputBlur}
            placeholder="Search for customer..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {showCustomerDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCustomers.map((customer) => {
                return (
                  <div
                    key={customer.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="font-medium">{customer.name || "Unknown Customer"}</div>
                    {customer.username && (
                      <div className="text-xs text-gray-500 mt-1">{customer.username}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter job title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date (Optional)
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated End Date (Optional)
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any notes about this job..."
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            {initialData ? "Update Job" : "Add Job"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
