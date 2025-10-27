import React, { useState } from "react";
import { Button, Input } from "antd";

const { TextArea } = Input;

const EmployeeForm = ({ onSubmit, onCancel, initialData, isLoading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Employee name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name (Required) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter employee name"
          size="large"
          status={errors.name ? "error" : ""}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <Input
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          placeholder="Enter phone number"
          size="large"
        />
      </div>

      {/* Email (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="Enter email address"
          size="large"
        />
      </div>

      {/* Address (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <Input
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="Enter address"
          size="large"
        />
      </div>

      {/* Notes (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <TextArea
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
          size="large"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={isLoading}
          className="flex-1"
          style={{ background: '#1f2937' }}
        >
          {initialData ? "Update Employee" : "Add Employee"}
        </Button>
        <Button
          type="default"
          size="large"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
