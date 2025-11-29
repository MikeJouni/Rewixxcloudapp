import React, { useState, useEffect } from "react";
import { Button, Input, DatePicker, Select, InputNumber, Switch } from "antd";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import * as jobService from "../../../Jobs/services/jobService";
import * as employeeService from "../../../Employees/services/employeeService";

const { TextArea } = Input;
const { Option } = Select;

const EXPENSE_TYPES = [
  { value: "LABOR", label: "Labor / Employee Hours" },
  { value: "MATERIAL", label: "Materials" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "PERMIT", label: "Permit / License" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OFFICE", label: "Office Supplies" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTHER", label: "Other" },
];

const ExpenseForm = ({ onSubmit, onCancel, initialData, isLoading }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || "LABOR",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    expenseDate: initialData?.expenseDate ? dayjs(initialData.expenseDate) : dayjs(),
    employeeName: initialData?.employeeName || "",
    hoursWorked: initialData?.hoursWorked || "",
    hourlyRate: initialData?.hourlyRate || "",
    jobId: initialData?.jobId || null,
    vendor: initialData?.vendor || "",
    receiptNumber: initialData?.receiptNumber || "",
    billable: initialData?.billable || false,
  });

  const [errors, setErrors] = useState({});

  // Fetch jobs for dropdown
  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobService.getJobsList({ page: 0, pageSize: 100, searchTerm: "" }),
  });

  const jobs = jobsData?.jobs || [];

  // Fetch employees for dropdown using the same /list endpoint as the Employees page
  const {
    data: employeesData,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees", "for-expenses"],
    queryFn: async () => {
      try {
        // Reuse the POST /api/employees/list endpoint to get all employees
        const response = await employeeService.getAllEmployees("");
        // response can be either an array or an object with employees property
        const list =
          Array.isArray(response) ? response : Array.isArray(response?.employees) ? response.employees : [];
        return list;
      } catch (error) {
        console.error("Error fetching employees for expenses:", error);
        throw error;
      }
    },
    staleTime: 30000,
  });

  const employees = Array.isArray(employeesData) ? employeesData : [];

  // Auto-calculate amount for labor expenses
  useEffect(() => {
    if (formData.type === "LABOR" && formData.hoursWorked && formData.hourlyRate) {
      const calculatedAmount = parseFloat(formData.hoursWorked) * parseFloat(formData.hourlyRate);
      setFormData(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
    }
  }, [formData.type, formData.hoursWorked, formData.hourlyRate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = "Expense type is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = "Expense date is required";
    }

    // Labor-specific validations
    if (formData.type === "LABOR") {
      if (!formData.employeeName || formData.employeeName.trim() === "") {
        newErrors.employeeName = "Employee name is required for labor expenses";
      }
      if (!formData.hoursWorked || parseFloat(formData.hoursWorked) <= 0) {
        newErrors.hoursWorked = "Hours worked must be greater than zero";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      expenseDate: formData.expenseDate.format("YYYY-MM-DD"),
      amount: parseFloat(formData.amount),
      hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : null,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
    };

    onSubmit(submissionData);
  };

  const isLaborExpense = formData.type === "LABOR";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Expense Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expense Type *
        </label>
        <Select
          value={formData.type}
          onChange={(value) => handleInputChange("type", value)}
          className="w-full"
          size="large"
          status={errors.type ? "error" : ""}
        >
          {EXPENSE_TYPES.map(type => (
            <Option key={type.value} value={type.value}>{type.label}</Option>
          ))}
        </Select>
        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
      </div>

      {/* Labor-specific fields */}
      {isLaborExpense && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <Select
              value={formData.employeeName}
              onChange={(value) => handleInputChange("employeeName", value)}
              className="w-full"
              size="large"
              placeholder={employeesLoading ? "Loading employees..." : employees.length === 0 ? "No employees available" : "Select an employee"}
              status={errors.employeeName ? "error" : ""}
              showSearch
              loading={employeesLoading}
              notFoundContent={employeesLoading ? "Loading..." : "No employees found"}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees.map(employee => (
                <Option key={employee.id} value={employee.name}>
                  {employee.name}
                  {employee.phone && <span className="text-gray-500 text-xs ml-2">({employee.phone})</span>}
                </Option>
              ))}
            </Select>
            {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Need to add a new employee? Go to <a href="/employees/create" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Employee Management</a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked *
              </label>
              <InputNumber
                value={formData.hoursWorked}
                onChange={(value) => handleInputChange("hoursWorked", value)}
                placeholder="0.00"
                min={0}
                step={0.5}
                className="w-full"
                size="large"
                status={errors.hoursWorked ? "error" : ""}
              />
              {errors.hoursWorked && <p className="text-red-500 text-xs mt-1">{errors.hoursWorked}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate
              </label>
              <InputNumber
                value={formData.hourlyRate}
                onChange={(value) => handleInputChange("hourlyRate", value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                prefix="$"
                className="w-full"
                size="large"
              />
            </div>
          </div>
        </>
      )}

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount * {isLaborExpense && "(Auto-calculated)"}
        </label>
        <InputNumber
          value={formData.amount}
          onChange={(value) => handleInputChange("amount", value)}
          placeholder="0.00"
          min={0}
          step={0.01}
          prefix="$"
          className="w-full"
          size="large"
          status={errors.amount ? "error" : ""}
          disabled={isLaborExpense && formData.hoursWorked && formData.hourlyRate}
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Expense Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expense Date *
        </label>
        <DatePicker
          value={formData.expenseDate}
          onChange={(date) => handleInputChange("expenseDate", date)}
          className="w-full"
          size="large"
          format="YYYY-MM-DD"
          status={errors.expenseDate ? "error" : ""}
        />
        {errors.expenseDate && <p className="text-red-500 text-xs mt-1">{errors.expenseDate}</p>}
      </div>

      {/* Job Association */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Associated Job (Optional)
        </label>
        <Select
          value={formData.jobId}
          onChange={(value) => handleInputChange("jobId", value)}
          className="w-full"
          size="large"
          allowClear
          placeholder="Select a job"
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {jobs.map(job => (
            <Option key={job.id} value={job.id}>
              #{job.id} - {job.title}
            </Option>
          ))}
        </Select>
      </div>

      {/* Vendor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vendor / Payee
        </label>
        <Input
          value={formData.vendor}
          onChange={(e) => handleInputChange("vendor", e.target.value)}
          placeholder="Vendor or payee name"
          size="large"
        />
      </div>

      {/* Receipt Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt / Invoice Number
        </label>
        <Input
          value={formData.receiptNumber}
          onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
          placeholder="Receipt or invoice number"
          size="large"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description / Notes
        </label>
        <TextArea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
          size="large"
        />
      </div>

      {/* Billable */}
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.billable}
          onChange={(checked) => handleInputChange("billable", checked)}
        />
        <label className="text-sm font-medium text-gray-700">
          Billable to customer
        </label>
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
          {initialData ? "Update Expense" : "Create Expense"}
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

export default ExpenseForm;
