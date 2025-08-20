import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerTable = ({ customers, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  if (customers.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        No customers found matching your search.
      </p>
    );
  }

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    const formData = {
      name: customer.name || "",
      username: customer.username || "",
      phone: customer.phone || "",
      addressLine1: customer.addressLine1 || "",
      addressLine2: customer.addressLine2 || "",
      city: customer.city || "",
      state: customer.state || "",
      zip: customer.zip || "",
    };
    setEditFormData(formData);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (customerId) => {
    try {
      await onUpdate({ id: customerId, ...editFormData });
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <React.Fragment key={customer.id}>
                {/* Main Row */}
                <tr
                  className={`hover:bg-gray-50 ${
                    editingId === customer.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {[customer.addressLine1, customer.addressLine2]
                      .filter(Boolean)
                      .join(", ")}
                    <br />
                    {[customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {editingId === customer.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit(customer.id);
                            }}
                            className="px-2 py-1 text-xs bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(customer.id);
                            }}
                            className="px-2 py-1 text-xs bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Edit Form Row */}
                {editingId === customer.id && (
                  <tr className="bg-blue-50">
                    <td colSpan="6" className="px-6 py-4">
                      <div className="bg-white rounded-lg border border-blue-200 p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Customer</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* Email */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              name="username"
                              value={editFormData.username}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* Phone */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={editFormData.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* Address Line 1 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              name="addressLine1"
                              value={editFormData.addressLine1}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* Address Line 2 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              name="addressLine2"
                              value={editFormData.addressLine2}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* City */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={editFormData.city}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* State */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={editFormData.state}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          {/* ZIP */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              ZIP *
                            </label>
                            <input
                              type="text"
                              name="zip"
                              value={editFormData.zip}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
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

export default CustomerTable;
