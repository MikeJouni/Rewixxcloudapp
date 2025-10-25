import React from "react";
import { Button } from "antd";
import CustomerSelector from "./CustomerSelector";

const JobEditModal = ({
  isOpen,
  editingId,
  editFormData,
  customers,
  filteredCustomers,
  customerSearchTerm,
  showCustomerDropdown,
  onClose,
  onInputChange,
  onCustomerSearch,
  onCustomerSelect,
  onSaveEdit,
  onDropdownToggle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Edit Job</h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <CustomerSelector
              customers={customers}
              filteredCustomers={filteredCustomers}
              customerSearchTerm={customerSearchTerm}
              showDropdown={showCustomerDropdown}
              onSearchChange={(term) => onCustomerSearch(editingId, term)}
              onCustomerSelect={(customer) => onCustomerSelect(editingId, customer)}
              onDropdownToggle={(show) => onDropdownToggle(show)}
            />
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={editFormData.title}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              name="description"
              value={editFormData.description}
              onChange={onInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this job..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => onSaveEdit(editingId)}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobEditModal;
