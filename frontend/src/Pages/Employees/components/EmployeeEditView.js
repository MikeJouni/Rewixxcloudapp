import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Card, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import EmployeeForm from "./EmployeeForm";
import useEmployees from "../hooks/useEmployees";
import * as employeeService from "../services/employeeService";

const EmployeeEditView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { updateEmployee } = useEmployees();

  const [employee, setEmployee] = useState(location.state?.employee || null);
  const [loading, setLoading] = useState(!location.state?.employee);

  useEffect(() => {
    if (!location.state?.employee) {
      // Fetch employee data if not passed via location state
      setLoading(true);
      employeeService.getEmployee(id)
        .then(response => {
          setEmployee(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch employee:", error);
          setLoading(false);
          navigate("/employees");
        });
    }
  }, [id, location.state, navigate]);

  const handleSubmit = async (formData) => {
    try {
      await updateEmployee.mutateAsync({ id: parseInt(id), data: formData });
      navigate("/employees");
    } catch (error) {
      console.error("Failed to update employee:", error);
    }
  };

  const handleCancel = () => {
    navigate("/employees");
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center">
        <Spin size="large" />
        <p className="mt-3 text-gray-600">Loading employee...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center">
        <p className="text-red-600">Employee not found</p>
        <Button onClick={handleCancel}>Back to Employees</Button>
      </div>
    );
  }

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
          Edit Employee
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <EmployeeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={employee}
          isLoading={updateEmployee.isLoading}
        />
      </Card>
    </div>
  );
};

export default EmployeeEditView;
