import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spin, Select, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import ExpenseTable from "./tables/ExpenseTable";
import useExpenses from "../hooks/useExpenses";
import ConfirmModal from "../../../components/ConfirmModal";

const { Option } = Select;

const EXPENSE_TYPE_OPTIONS = [
  { value: "All", label: "All Types" },
  { value: "LABOR", label: "Labor" },
  { value: "MATERIAL", label: "Materials" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "PERMIT", label: "Permit" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OFFICE", label: "Office" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTHER", label: "Other" },
];

const ExpenseListView = () => {
  const navigate = useNavigate();
  const {
    expenses,
    isLoading,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,
    totalExpenses,
    deleteExpense,
  } = useExpenses();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const handleEdit = (expense) => {
    navigate(`/expenses/edit/${expense.id}`, { state: { expense } });
  };

  const handleDelete = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    setExpenseToDelete(expense);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete.id, {
        onSuccess: () => {
          setDeleteModalVisible(false);
          setExpenseToDelete(null);
        }
      });
    }
  };

  // Calculate total for current page
  const currentPageTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Expense Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track non-billable expenses and labor hours
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/expenses/create")}
          className="w-full sm:w-auto"
          style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            border: 'none',
          }}
        >
          Add New Expense
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
        <Input
          size="large"
          placeholder="Search expenses by description, employee, vendor..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ borderRadius: '8px', flex: 1 }}
        />
        <Select
          size="large"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 200 }}
        >
          {EXPENSE_TYPE_OPTIONS.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </div>

      {/* Summary Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{totalExpenses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Page Total</p>
            <p className="text-2xl font-bold text-blue-600">${currentPageTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-3 text-gray-600 text-lg">Loading expenses...</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
          <ExpenseTable
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            size="small"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            size="small"
          >
            Next
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPage(0);
              setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalVisible}
        title="Delete Expense"
        message={`Are you sure you want to delete this ${expenseToDelete?.type.toLowerCase()} expense${expenseToDelete?.employeeName ? ` for ${expenseToDelete.employeeName}` : ''}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => {
          setDeleteModalVisible(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ExpenseListView;
