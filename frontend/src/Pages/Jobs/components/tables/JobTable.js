import React, { useState, useEffect } from "react";
import * as customerService from "../../../Customers/services/customerService";
import MaterialForm from "../forms/MaterialForm";

const JobTable = ({
  jobs,
  onViewDetails,
  onEdit,
  onDelete,
  onReceiptUpload,
  onAddMaterial,
  processingReceiptJobId = null,
  isMobile = false,
  showingMaterialFormForJob = null,
  onCloseMaterialForm,
  onMaterialSubmit,
  products = [],
  productsLoading = false,
  productsError = null,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState({});

  const statusOptions = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomersList({ pageSize: 1000 });
      if (response && response.customers) {
        setCustomers(response.customers);
        setFilteredCustomers(response.customers);
        console.log(`Fetched ${response.customers.length} customers for job editing`);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);
    setEditFormData({
      customerId: job.customer?.id || "",
      title: job.title || "",
      description: job.description || "",
      status: job.status || "PENDING",
      priority: job.priority || "MEDIUM",
      startDate: job.startDate || "",
      endDate: job.endDate || "",
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
      console.log("Saving job update:", { ...editFormData, id: jobId });
      await onEdit({ ...editFormData, id: jobId });
      console.log("Job update successful");
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
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (jobs.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        No jobs found matching your criteria.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <React.Fragment key={job.id}>
                {/* Main Row */}
                <tr className={`hover:bg-gray-50 ${editingId === job.id ? "bg-blue-50" : ""}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.customer?.name || "No Customer"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        job.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : job.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : job.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {job.status?.replace('_', ' ') || job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        job.priority === "LOW"
                          ? "text-green-600"
                          : job.priority === "MEDIUM"
                          ? "text-yellow-600"
                          : job.priority === "HIGH"
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {job.priority?.charAt(0) + job.priority?.slice(1).toLowerCase() || job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.startDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {
                      (() => {
                        try {
                          const sales = Array.isArray(job.sales) ? job.sales : [];
                          const total = sales.reduce((sum, sale) => {
                            const items = Array.isArray(sale.saleItems) ? sale.saleItems : [];
                            return sum + items.reduce((s, it) => s + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)), 0);
                          }, 0);
                          return `$${total.toFixed(2)}`;
                        } catch (e) {
                          return "$0.00";
                        }
                      })()
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-1 flex-wrap">
                      {editingId === job.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(job.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onViewDetails(job)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(job)}
                            className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onAddMaterial(job)}
                            className="px-2 py-1 text-xs bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600"
                          >
                            Add Material
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this job?")) {
                                onDelete(job.id);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {isMobile && (
                        <label
                          className={`px-2 py-1 text-xs text-white border-none rounded cursor-pointer ${
                            processingReceiptJobId && processingReceiptJobId !== job.id
                              ? "bg-gray-400 cursor-not-allowed opacity-70"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {processingReceiptJobId === job.id ? "Loading receipt..." : "Attach Receipt"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onReceiptUpload(job.id, e)}
                            className="hidden"
                            disabled={Boolean(processingReceiptJobId)}
                          />
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Edit Form Row */}
                {editingId === job.id && (
                  <tr className="bg-blue-50">
                    <td colSpan="9" className="px-6 py-4">
                      <div className="bg-white rounded-lg border border-blue-200 p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Job</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Customer Selection */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Customer *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search customers..."
                                value={customerSearchTerm}
                                onChange={(e) => {
                                  setCustomerSearchTerm(e.target.value);
                                  handleCustomerSearch(job.id, e.target.value);
                                  setShowCustomerDropdown(prev => ({ ...prev, [job.id]: true }));
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              {showCustomerDropdown[job.id] && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                                  {filteredCustomers.map((customer) => (
                                    <div
                                      key={customer.id}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectCustomer(job.id, customer)}
                                    >
                                      {customer.name} ({customer.username})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Title */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              name="title"
                              value={editFormData.title}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* Status */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Status *
                            </label>
                            <select
                              name="status"
                              value={editFormData.status}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Priority */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Priority *
                            </label>
                            <select
                              name="priority"
                              value={editFormData.priority}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            >
                              {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Start Date */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              value={editFormData.startDate}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* End Date */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              value={editFormData.endDate}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* Description */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Description
                            </label>
                            <textarea
                              name="description"
                              value={editFormData.description}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Add any notes about this job..."
                            />
                          </div>
                        </div>
                        
                        {/* Edit Form Actions */}
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(job.id)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Material Form Row */}
                {showingMaterialFormForJob === job.id && (
                  <tr className="bg-green-50">
                    <td colSpan="9" className="px-6 py-4">
                      <div className="bg-white rounded-lg border border-green-200 p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Add Material to Job
                          {productsLoading && <span className="ml-2 text-gray-500">(Loading products...)</span>}
                          {!productsLoading && <span className="ml-2 text-gray-500">({products.length} products available)</span>}
                        </h4>
                        {productsError && (
                          <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
                            Error loading products: {productsError.message}
                          </div>
                        )}
                        <MaterialForm
                          onSubmit={onMaterialSubmit}
                          onCancel={onCloseMaterialForm}
                          products={products}
                          isMobile={isMobile}
                          productsLoading={productsLoading}
                          productsError={productsError}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;
