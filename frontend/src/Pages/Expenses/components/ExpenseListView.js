import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Spin,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ExpenseTable from "./tables/ExpenseTable";
import useExpenses from "../hooks/useExpenses";
import ConfirmModal from "../../../components/ConfirmModal";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

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
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  const handleEdit = (expense) => {
    navigate(`/expenses/edit/${expense.id}`, { state: { expense } });
  };

  const handleDelete = (expenseId) => {
    const expense = expenses.find((e) => e.id === expenseId);
    setExpenseToDelete(expense);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete.id, {
        onSuccess: () => {
          setDeleteModalVisible(false);
          setExpenseToDelete(null);
        },
      });
    }
  };

  // Handle multi-select type filter
  const handleTypeFilterChange = (values) => {
    setSelectedTypes(values);
    // If no types selected or "All" behavior needed
    if (values.length === 0) {
      setTypeFilter("All");
    } else if (values.length === 1) {
      setTypeFilter(values[0]);
    } else {
      // For multiple selections, we'll pass "All" and filter client-side
      // Or you could modify the backend to accept multiple types
      setTypeFilter("All");
    }
  };

  // Filter expenses based on selected types and date range (client-side)
  const filteredExpenses = expenses.filter((exp) => {
    // Type filter
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(exp.type);

    // Date range filter
    let matchesDate = true;
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const expenseDate = dayjs(exp.expenseDate);
      matchesDate =
        (expenseDate.isAfter(dateRange[0]) || expenseDate.isSame(dateRange[0], "day")) &&
        (expenseDate.isBefore(dateRange[1]) || expenseDate.isSame(dateRange[1], "day"));
    }

    return matchesType && matchesDate;
  });

  // Calculate totals
  const currentPageTotal = filteredExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount || 0),
    0
  );

  return (
    <div className="w-full h-full" style={{ padding: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Business Expense Management
          </Typography.Title>
          <Text type="secondary">Track and manage company expenses</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/expenses/create")}
        >
          Add Expense
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={12}>
          <Card size="small">
            <Statistic
              title="Total Expenses"
              value={totalExpenses}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={12}>
          <Card size="small">
            <Statistic
              title="Page Total"
              value={currentPageTotal}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={8}>
            <Input
              size="large"
              placeholder="Search by description, employee, vendor..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              mode="multiple"
              size="large"
              placeholder="Filter by type"
              value={selectedTypes}
              onChange={handleTypeFilterChange}
              style={{ width: "100%" }}
              allowClear
              maxTagCount={2}
              maxTagPlaceholder={(omittedValues) =>
                `+${omittedValues.length} more`
              }
            >
              {EXPENSE_TYPE_OPTIONS.filter((opt) => opt.value !== "All").map(
                (opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                )
              )}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              size="large"
              value={dateRange}
              onChange={setDateRange}
              style={{ width: "100%" }}
              placeholder={["Start Date", "End Date"]}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Expenses Table */}
      <Card size="small">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: "#666" }}>Loading expenses...</p>
          </div>
        ) : (
          <ExpenseTable
            expenses={filteredExpenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}

        {/* Pagination Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #f0f0f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevious}
              size="small"
            >
              Previous
            </Button>
            <Text type="secondary">
              Page {page + 1} of {totalPages || 1}
            </Text>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={!hasNext}
              size="small"
            >
              Next
            </Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary">Rows per page:</Text>
            <Select
              size="small"
              value={pageSize}
              onChange={(value) => {
                setPage(0);
                setPageSize(value);
              }}
              style={{ width: 70 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={25}>25</Option>
              <Option value={50}>50</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalVisible}
        title="Delete Expense"
        message={`Are you sure you want to delete this ${expenseToDelete?.type?.toLowerCase()} expense${
          expenseToDelete?.employeeName
            ? ` for ${expenseToDelete.employeeName}`
            : ""
        }?`}
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
