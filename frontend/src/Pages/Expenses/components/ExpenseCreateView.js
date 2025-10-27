import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ExpenseForm from "./forms/ExpenseForm";
import useExpenses from "../hooks/useExpenses";

const ExpenseCreateView = () => {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();

  const handleSubmit = async (formData) => {
    try {
      await addExpense.mutateAsync(formData);
      navigate("/expenses");
    } catch (error) {
      console.error("Failed to create expense:", error);
      // Error is handled by the mutation
    }
  };

  const handleCancel = () => {
    navigate("/expenses");
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
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
          Add New Expense
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={addExpense.isLoading}
        />
      </Card>
    </div>
  );
};

export default ExpenseCreateView;
