import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import EmployeeForm from "./EmployeeForm";
import useEmployees from "../hooks/useEmployees";

const EmployeeCreateView = () => {
  const navigate = useNavigate();
  const { addEmployee, setSearchTerm } = useEmployees();

  const handleSubmit = async (formData) => {
    try {
      // Clean up form data: convert empty strings to null for optional fields
      const cleanedData = {
        name: formData.name?.trim() || "",
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        notes: formData.notes?.trim() || null,
        active: true, // Default to active for new employees
      };
      
      await addEmployee.mutateAsync(cleanedData);
      message.success("Employee created successfully");
      // Clear search term to ensure new employee is visible
      setSearchTerm("");
      navigate("/employees");
    } catch (error) {
      console.error("Failed to create employee:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to create employee. Please try again.";
      message.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate("/employees");
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          size="large"
        >
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Add New Employee
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <EmployeeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={addEmployee.isLoading}
        />
      </Card>
    </div>
  );
};

export default EmployeeCreateView;
