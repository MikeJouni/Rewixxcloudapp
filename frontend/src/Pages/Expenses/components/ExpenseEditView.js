import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Card, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ExpenseForm from "./forms/ExpenseForm";
import useExpenses from "../hooks/useExpenses";
import * as expenseService from "../services/expenseService";

const ExpenseEditView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { updateExpense } = useExpenses();

  const [expense, setExpense] = useState(location.state?.expense || null);
  const [loading, setLoading] = useState(!location.state?.expense);

  useEffect(() => {
    if (!location.state?.expense) {
      // Fetch expense data if not passed via location state
      setLoading(true);
      expenseService.getExpense(id)
        .then(response => {
          setExpense(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch expense:", error);
          setLoading(false);
          navigate("/expenses");
        });
    }
  }, [id, location.state, navigate]);

  const handleSubmit = async (formData) => {
    try {
      await updateExpense.mutateAsync({ id: parseInt(id), data: formData });
      navigate("/expenses");
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  };

  const handleCancel = () => {
    navigate("/expenses");
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 text-center">
        <Spin size="large" />
        <p className="mt-3 text-gray-600">Loading expense...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 text-center">
        <p className="text-red-600">Expense not found</p>
        <Button onClick={handleCancel}>Back to Expenses</Button>
      </div>
    );
  }

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
          Edit Expense
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={expense}
          isLoading={updateExpense.isLoading}
        />
      </Card>
    </div>
  );
};

export default ExpenseEditView;
