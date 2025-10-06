import React, { useState, useEffect } from "react";
import * as customerService from "../../../Customers/services/customerService";

const JobForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData ? {
      customerId: initialData.customer?.id || "",
      title: initialData.title || "",
      description: initialData.description || "",
      status: initialData.status || "IN_PROGRESS",
      priority: initialData.priority || "MEDIUM",
    } : {
      customerId: "",
      title: "",
      description: "",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    }
  );

  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);


  const statusOptions = ["IN_PROGRESS"];
  const priorityOptions = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-orange-600" },
    { value: "URGENT", label: "Urgent", color: "text-red-600" }
  ];

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
      const response = await customerService.getCustomersList({ pageSize: 1000 });
      if (response && response.customers) {
        setCustomers(response.customers);
        setFilteredCustomers(response.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields (non-blocking)
    if (!formData.title.trim()) {
      return;
    }
    if (!formData.customerId) {
      return;
    }
    if (!formData.status) {
      return;
    }
    if (!formData.priority) {
      return;
    }
    
    // Prepare data for submission
    const submissionData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description || "",
      // Set start date to current date for new jobs, preserve existing for edits
      startDate: initialData ? formData.startDate : new Date().toISOString().split('T')[0],
      endDate: formData.endDate || null,
      // Ensure customerId is a number
      customerId: parseInt(formData.customerId)
    };
    

    
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
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {showCustomerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
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
                  })
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    {customers.length === 0 
                      ? "No customers available. Please add a customer first." 
                      : "No customers match your search."
                    }
                  </div>
                )}
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
                <option key={option.value} value={option.value} className={option.color}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
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
        <div className="flex gap-3">
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
