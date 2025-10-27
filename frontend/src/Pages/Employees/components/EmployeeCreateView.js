import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import EmployeeForm from "./EmployeeForm";
import useEmployees from "../hooks/useEmployees";

const EmployeeCreateView = () => {
  const navigate = useNavigate();
  const { addEmployee } = useEmployees();

  const handleSubmit = async (formData) => {
    try {
      await addEmployee.mutateAsync(formData);
      navigate("/employees");
    } catch (error) {
      console.error("Failed to create employee:", error);
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
