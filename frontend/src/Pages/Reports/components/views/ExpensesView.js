import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  DatePicker,
  Empty,
  message,
  Typography,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

// Expense types excluding LABOR (which is employee-linked)
const EXPENSE_TYPES = [
  { value: "MATERIAL", label: "Material" },
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

const ExpensesView = ({
  expenses = [],
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  // Filter expenses - exclude LABOR type (employee-linked)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Exclude LABOR type expenses (these are employee-linked)
      if (expense.type === "LABOR") return false;

      // Search filter
      const matchesSearch =
        !searchTerm ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        typeFilter.length === 0 || typeFilter.includes(expense.type);

      // Date range filter
      let matchesDate = true;
      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const expenseDate = dayjs(expense.expenseDate);
        matchesDate =
          (expenseDate.isAfter(dateRange[0]) || expenseDate.isSame(dateRange[0], "day")) &&
          (expenseDate.isBefore(dateRange[1]) || expenseDate.isSame(dateRange[1], "day"));
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [expenses, searchTerm, typeFilter, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) => sum + (parseFloat(e.amount) || 0),
      0
    );

    // Group by type
    const byType = {};
    filteredExpenses.forEach((expense) => {
      const type = expense.type || "OTHER";
      if (!byType[type]) {
        byType[type] = 0;
      }
      byType[type] += parseFloat(expense.amount) || 0;
    });

    return {
      totalExpenses,
      expenseCount: filteredExpenses.length,
      byType,
    };
  }, [filteredExpenses]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredExpenses.map((expense) => ({
        Date: expense.expenseDate
          ? dayjs(expense.expenseDate).format("YYYY-MM-DD")
          : "",
        Type: expense.type,
        Description: expense.description || "",
        Vendor: expense.vendor || "",
        Amount: parseFloat(expense.amount) || 0,
        "Receipt #": expense.receiptNumber || "",
        Job: expense.job?.title || "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

      const filename = `expenses-${dateRange[0]?.format("YYYY-MM-DD")}-to-${dateRange[1]?.format("YYYY-MM-DD")}.xlsx`;
      XLSX.writeFile(workbook, filename);
      message.success("Exported successfully");
    } catch (error) {
      console.error("Error exporting:", error);
      message.error("Failed to export");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
      render: (date) => (date ? dayjs(date).format("MMM D, YYYY") : "-"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const typeConfig = EXPENSE_TYPES.find((t) => t.value === type);
        return <Tag>{typeConfig?.label || type}</Tag>;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => text || "-",
      responsive: ["md"],
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      key: "vendor",
      render: (text) => text || "-",
      responsive: ["lg"],
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0),
      render: (amount) => (
        <Text strong>
          ${(parseFloat(amount) || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </Text>
      ),
    },
    {
      title: "Job",
      dataIndex: ["job", "title"],
      key: "job",
      render: (text) => text || "-",
      responsive: ["lg"],
    },
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={12}>
          <Card size="small">
            <Statistic
              title="Total Expenses"
              value={totals.totalExpenses}
              prefix="$"
              precision={2}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {totals.expenseCount} entries
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={12}>
          <Card size="small">
            <Statistic
              title="Average per Entry"
              value={totals.expenseCount > 0 ? totals.totalExpenses / totals.expenseCount : 0}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={7}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: "100%" }}
              placeholder={["Start", "End"]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: "100%" }}
              placeholder="Filter by type"
              allowClear
              maxTagCount={1}
            >
              {EXPENSE_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={7}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              style={{ width: "100%" }}
            >
              Export
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Expenses Table */}
      <Card size="small">
        {filteredExpenses.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredExpenses}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              size: "small",
            }}
            scroll={{ x: 600 }}
            size="middle"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>
                      ${totals.totalExpenses.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Empty description="No expenses found for the selected filters" />
        )}
      </Card>
    </div>
  );
};

export default ExpensesView;
