import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Progress,
  Tag,
  Table,
  Empty,
  DatePicker,
  Select,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";
import * as employeeService from "../Employees/services/employeeService";
import * as expenseService from "../Expenses/services/expenseService";
import * as contractService from "../Contracts/services/contractService";
import * as accountSettingsService from "../../services/accountSettingsService";
import { useAuth } from "../../AuthContext";
import config from "../../config";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Date range state - default to last 30 days
  // Add 1 day to end date to account for timezone differences (server may store in UTC)
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "day").startOf("day"),
    dayjs().add(1, "day").endOf("day"),
  ]);
  const [quickRange, setQuickRange] = useState("30");

  // Quick range options
  const quickRangeOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "14", label: "Last 14 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "60", label: "Last 60 Days" },
    { value: "90", label: "Last 90 Days" },
    { value: "365", label: "Last Year" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom Range" },
  ];

  // Handle quick range change
  const handleQuickRangeChange = (value) => {
    setQuickRange(value);
    if (value === "all") {
      setDateRange(null);
    } else if (value !== "custom") {
      // Add 1 day to end to account for timezone differences
      const days = parseInt(value);
      setDateRange([dayjs().subtract(days - 1, "day").startOf("day"), dayjs().add(1, "day").endOf("day")]);
    }
  };

  // Handle custom date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      // Add 1 day to end to account for timezone differences
      setDateRange([dates[0].startOf("day"), dates[1].add(1, "day").endOf("day")]);
    } else {
      setDateRange(dates);
    }
    if (dates) {
      setQuickRange("custom");
    }
  };

  // Fetch all data
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getCustomersList({ pageSize: 10000 }),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () =>
      jobService.getJobsList({
        searchTerm: "",
        page: 0,
        pageSize: 10000,
        statusFilter: "All",
      }),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeService.getAllEmployees(),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () =>
      expenseService.getExpensesList({
        page: 0,
        pageSize: 10000,
        searchTerm: "",
        typeFilter: "All",
      }),
  });

  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractService.getContractsList({
        page: 0,
        pageSize: 10000,
        searchTerm: "",
      }),
  });

  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  // Extract data
  const customers = customersData?.customers || [];
  const allJobs = jobsData?.jobs || [];
  const employees = employeesData?.employees || [];
  const allExpenses = expensesData?.expenses || [];
  const allContracts = contractsData?.contracts || [];

  const companyName = accountSettings?.companyName || "Dashboard";
  const companyLogoUrl = accountSettings?.logoUrl
    ? `${config.SPRING_API_BASE}${accountSettings.logoUrl}`
    : null;

  // Filter function for date range
  const isInDateRange = (date) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
    if (!date) return false;
    const itemDate = dayjs(date);
    // dateRange[0] is start of first day, dateRange[1] is end of last day
    return !itemDate.isBefore(dateRange[0]) && !itemDate.isAfter(dateRange[1]);
  };

  // Filtered data based on date range
  const jobs = useMemo(() => {
    return allJobs.filter((job) => isInDateRange(job.startDate));
  }, [allJobs, dateRange]);

  const expenses = useMemo(() => {
    return allExpenses.filter((expense) => isInDateRange(expense.expenseDate));
  }, [allExpenses, dateRange]);

  const contracts = useMemo(() => {
    return allContracts.filter((contract) => isInDateRange(contract.contractDate));
  }, [allContracts, dateRange]);

  // Calculate job total cost
  const computeTotalCost = (job) => {
    if (!job) return 0;
    const billingMaterialCost =
      job.customMaterialCost !== undefined && job.customMaterialCost !== null
        ? Number(job.customMaterialCost)
        : 0;
    const jobPrice = Number(job.jobPrice) || 0;
    const subtotal = billingMaterialCost + jobPrice;
    const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
    return subtotal + taxAmount;
  };

  // Calculate all metrics
  const metrics = useMemo(() => {
    // Job metrics
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
    const inProgressJobs = jobs.filter(
      (j) => j.status === "IN_PROGRESS" || j.status === "PENDING"
    ).length;
    const cancelledJobs = jobs.filter((j) => j.status === "CANCELLED").length;

    // Revenue calculations
    let totalRevenue = 0;
    let totalPaid = 0;

    jobs.forEach((job) => {
      totalRevenue += computeTotalCost(job);
      if (job.payments && Array.isArray(job.payments)) {
        job.payments.forEach((payment) => {
          // Filter payments by date range too
          if (isInDateRange(payment.paymentDate)) {
            totalPaid += Number(payment.amount) || 0;
          }
        });
      }
    });

    const totalOutstanding = totalRevenue - totalPaid;

    // Expense calculations
    let totalExpenses = 0;
    const expensesByType = {};

    expenses.forEach((expense) => {
      const amount = Number(expense.amount) || 0;
      totalExpenses += amount;
      const type = expense.type || "OTHER";
      expensesByType[type] = (expensesByType[type] || 0) + amount;
    });

    // Profit calculation
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Contract metrics
    const totalContracts = contracts.length;
    const paidContracts = contracts.filter((c) => c.status === "PAID").length;
    const unpaidContracts = contracts.filter((c) => c.status === "UNPAID").length;
    const partialContracts = contracts.filter((c) => c.status === "PARTIAL").length;

    // Customer metrics (customers with jobs in period)
    const activeCustomerIds = new Set(jobs.map((j) => j.customer?.id).filter(Boolean));
    const activeCustomers = activeCustomerIds.size;

    // Employee metrics
    const totalEmployees = employees.filter((e) => e.active !== false).length;

    // Labor hours from expenses (already filtered)
    let totalLaborHours = 0;
    let totalLaborCost = 0;
    expenses
      .filter((e) => e.type === "LABOR")
      .forEach((e) => {
        totalLaborHours += Number(e.hoursWorked) || 0;
        totalLaborCost += Number(e.amount) || 0;
      });

    // Recent jobs (last 5 in filtered range)
    const recentJobs = [...jobs]
      .sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt))
      .slice(0, 5);

    // Top customers by revenue (in filtered range)
    const customerRevenue = {};
    jobs.forEach((job) => {
      if (job.customer) {
        const customerId = job.customer.id;
        const customerName = job.customer.name;
        if (!customerRevenue[customerId]) {
          customerRevenue[customerId] = { name: customerName, revenue: 0, jobs: 0 };
        }
        customerRevenue[customerId].revenue += computeTotalCost(job);
        customerRevenue[customerId].jobs += 1;
      }
    });
    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      cancelledJobs,
      totalRevenue,
      totalPaid,
      totalOutstanding,
      totalExpenses,
      expensesByType,
      grossProfit,
      profitMargin,
      totalContracts,
      paidContracts,
      unpaidContracts,
      partialContracts,
      totalCustomers: customers.length,
      activeCustomers,
      totalEmployees,
      totalLaborHours,
      totalLaborCost,
      recentJobs,
      topCustomers,
    };
  }, [jobs, expenses, contracts, customers, employees, dateRange]);

  // Loading state
  const isLoading =
    customersLoading ||
    jobsLoading ||
    employeesLoading ||
    expensesLoading ||
    contractsLoading;

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Job completion rate
  const completionRate =
    metrics.totalJobs > 0
      ? Math.round((metrics.completedJobs / metrics.totalJobs) * 100)
      : 0;

  // Payment collection rate
  const collectionRate =
    metrics.totalRevenue > 0
      ? Math.round((metrics.totalPaid / metrics.totalRevenue) * 100)
      : 0;

  // Recent jobs table columns
  const recentJobsColumns = [
    {
      title: "Job",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{text}</Text>
          {record.customer?.name && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.customer.name}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        let color = "processing";
        if (status === "COMPLETED") color = "success";
        if (status === "CANCELLED") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Amount",
      key: "amount",
      width: 100,
      render: (_, record) => (
        <Text strong>${computeTotalCost(record).toFixed(2)}</Text>
      ),
    },
  ];

  // Top customers table columns
  const topCustomersColumns = [
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Jobs",
      dataIndex: "jobs",
      key: "jobs",
      width: 60,
      render: (count) => <Tag>{count}</Tag>,
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      width: 100,
      render: (amount) => <Text strong>${amount.toFixed(2)}</Text>,
    },
  ];

  // Expense breakdown for display
  const expenseBreakdown = Object.entries(metrics.expensesByType)
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Get date range label for display
  const getDateRangeLabel = () => {
    if (!dateRange || quickRange === "all") return "All Time";
    return `${dateRange[0].format("MMM D, YYYY")} - ${dateRange[1].format("MMM D, YYYY")}`;
  };

  return (
    <div className="w-full" style={{ padding: "16px" }}>
      {/* Header with Date Filter */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {companyLogoUrl && (
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              style={{ height: 40, width: 40, objectFit: "contain", borderRadius: 8 }}
            />
          )}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {companyName}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Business Overview
            </Text>
          </div>
        </div>

        {/* Date Range Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Select
            value={quickRange}
            onChange={handleQuickRangeChange}
            style={{ width: 140 }}
            options={quickRangeOptions}
          />
          {quickRange === "custom" && (
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: 260 }}
            />
          )}
        </div>
      </div>

      {/* Period Indicator */}
      <div style={{ marginBottom: 16 }}>
        <Tag icon={<CalendarOutlined />} color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>
          {getDateRangeLabel()}
        </Tag>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/jobs")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="Jobs"
              value={metrics.totalJobs}
              prefix={<ToolOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/jobs")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="Completed"
              value={metrics.completedJobs}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/jobs")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="In Progress"
              value={metrics.inProgressJobs}
              prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/customers")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="Active Customers"
              value={metrics.activeCustomers}
              prefix={<UserOutlined style={{ color: "#722ed1" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/employees")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="Employees"
              value={metrics.totalEmployees}
              prefix={<TeamOutlined style={{ color: "#13c2c2" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card
            size="small"
            hoverable
            onClick={() => navigate("/contracts")}
            style={{ cursor: "pointer" }}
          >
            <Statistic
              title="Contracts"
              value={metrics.totalContracts}
              prefix={<FileTextOutlined style={{ color: "#eb2f96" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Labor Hours"
              value={metrics.totalLaborHours}
              prefix={<CalendarOutlined style={{ color: "#fa8c16" }} />}
              suffix="hrs"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Labor Cost"
              value={metrics.totalLaborCost}
              precision={2}
              prefix={<DollarOutlined style={{ color: "#fa541c" }} />}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Indicators */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card size="small" title="Job Completion Rate">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Progress
                type="circle"
                percent={completionRate}
                size={80}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="success">{metrics.completedJobs} Completed</Tag>
                  <Tag color="processing">{metrics.inProgressJobs} In Progress</Tag>
                </div>
                {metrics.cancelledJobs > 0 && (
                  <Tag color="error">{metrics.cancelledJobs} Cancelled</Tag>
                )}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="Payment Collection Rate">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Progress
                type="circle"
                percent={collectionRate}
                size={80}
                strokeColor={{
                  "0%": "#52c41a",
                  "100%": "#52c41a",
                }}
              />
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">Collected: </Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    ${metrics.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Outstanding: </Text>
                  <Text strong style={{ color: metrics.totalOutstanding > 0 ? "#f5222d" : "#52c41a" }}>
                    ${metrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Contract Status */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card size="small" title="Contract Status">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text>Paid</Text>
                <Tag color="success">{metrics.paidContracts}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text>Unpaid</Text>
                <Tag color="error">{metrics.unpaidContracts}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text>Partial</Text>
                <Tag color="warning">{metrics.partialContracts}</Tag>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card size="small" title="Expense Breakdown">
            {expenseBreakdown.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {expenseBreakdown.map(({ type, amount }) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13 }}>{type}</Text>
                    </div>
                    <Progress
                      percent={Math.round((amount / metrics.totalExpenses) * 100)}
                      size="small"
                      style={{ flex: 2, margin: 0 }}
                      showInfo={false}
                    />
                    <Text strong style={{ width: 80, textAlign: "right", fontSize: 13 }}>
                      ${amount.toFixed(2)}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No expenses in this period" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Jobs & Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title="Recent Jobs"
            extra={
              <a onClick={() => navigate("/jobs")} style={{ fontSize: 13 }}>
                View All
              </a>
            }
          >
            {metrics.recentJobs.length > 0 ? (
              <Table
                columns={recentJobsColumns}
                dataSource={metrics.recentJobs}
                rowKey="id"
                pagination={false}
                size="small"
                showHeader={false}
              />
            ) : (
              <Empty description="No jobs in this period" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title="Top Customers by Revenue"
            extra={
              <a onClick={() => navigate("/customers")} style={{ fontSize: 13 }}>
                View All
              </a>
            }
          >
            {metrics.topCustomers.length > 0 ? (
              <Table
                columns={topCustomersColumns}
                dataSource={metrics.topCustomers}
                rowKey="name"
                pagination={false}
                size="small"
                showHeader={false}
              />
            ) : (
              <Empty description="No customer data in this period" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
