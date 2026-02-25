import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Spin,
  Tabs,
  Typography,
  Button,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Checkbox,
  message,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";
import * as employeeService from "../Employees/services/employeeService";
import * as expenseService from "../Expenses/services/expenseService";
import * as contractService from "../Contracts/services/contractService";
import * as accountSettingsService from "../../services/accountSettingsService";
import { useAuth } from "../../AuthContext";
import config from "../../config";
import JobsView from "./components/views/JobsView";
import CustomersView from "./components/views/CustomersView";
import EmployeesView from "./components/views/EmployeesView";
import ExpensesView from "./components/views/ExpensesView";
import "./reports.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportTypes, setSelectedExportTypes] = useState(["jobs"]);
  const [exportDateRange, setExportDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const { token } = useAuth();

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getCustomersList({ pageSize: 10000 }),
  });

  // Fetch jobs
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

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeService.getAllEmployees(),
  });

  // Fetch expenses
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

  // Fetch contracts
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractService.getContractsList({
        page: 0,
        pageSize: 10000,
        searchTerm: "",
      }),
  });

  // Fetch account settings for company branding
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  const companyName = accountSettings?.companyName || "Report Center";
  const companyLogoUrl = accountSettings?.logoUrl
    ? `${config.SPRING_API_BASE}${accountSettings.logoUrl}`
    : null;

  // Extract data from responses
  const customers = customersData?.customers || [];
  const jobs = jobsData?.jobs || [];
  const employees = employeesData?.employees || [];
  const expenses = expensesData?.expenses || [];
  const contracts = contractsData?.contracts || [];

  // Export function with summary calculations
  const handleExport = () => {
    try {
      if (selectedExportTypes.length === 0) {
        message.error("Please select at least one data type to export");
        return;
      }

      const startDate = exportDateRange?.[0];
      const endDate = exportDateRange?.[1];

      const filterByDate = (date) => {
        if (!startDate || !endDate) return true;
        if (!date) return false;
        const itemDate = dayjs(date);
        return (
          (itemDate.isAfter(startDate) || itemDate.isSame(startDate, "day")) &&
          (itemDate.isBefore(endDate) || itemDate.isSame(endDate, "day"))
        );
      };

      const workbook = XLSX.utils.book_new();
      const summaryData = [];
      let totalSheets = 0;

      // Jobs Summary & Data
      if (selectedExportTypes.includes("jobs")) {
        const filteredJobs = jobs.filter((job) => filterByDate(job.startDate));
        const jobsByStatus = {};
        let totalJobPrice = 0;
        let totalBillingMaterialCost = 0;
        let totalInternalMaterialCost = 0;
        let totalTaxAmount = 0;
        let totalPaidAmount = 0;

        filteredJobs.forEach((job) => {
          const status = job.status || "Unknown";
          jobsByStatus[status] = (jobsByStatus[status] || 0) + 1;

          const jobPrice = parseFloat(job.jobPrice) || 0;
          const billingMaterialCost = parseFloat(job.customMaterialCost) || 0;

          // Calculate internal material cost from job.sales (materials added to job)
          let internalMaterialCost = 0;
          if (job.sales && Array.isArray(job.sales)) {
            job.sales.forEach((sale) => {
              if (sale.saleItems && Array.isArray(sale.saleItems)) {
                sale.saleItems.forEach((saleItem) => {
                  const unitPrice = parseFloat(saleItem.unitPrice || saleItem.product?.unitPrice || 0);
                  const quantity = parseInt(saleItem.quantity) || 1;
                  internalMaterialCost += unitPrice * quantity;
                });
              }
            });
          }

          const subtotal = jobPrice + billingMaterialCost;
          const taxAmount = job.includeTax ? subtotal * 0.06 : 0;

          totalJobPrice += jobPrice;
          totalBillingMaterialCost += billingMaterialCost;
          totalInternalMaterialCost += internalMaterialCost;
          totalTaxAmount += taxAmount;

          // Calculate payments
          if (job.payments && Array.isArray(job.payments)) {
            job.payments.forEach((payment) => {
              totalPaidAmount += parseFloat(payment.amount) || 0;
            });
          }
        });

        const totalRevenue = totalJobPrice + totalBillingMaterialCost + totalTaxAmount;
        const totalOutstanding = totalRevenue - totalPaidAmount;
        const grossProfit = totalRevenue - totalInternalMaterialCost;

        summaryData.push(
          { Category: "JOBS SUMMARY", Metric: "", Value: "" },
          { Category: "", Metric: "Total Jobs", Value: filteredJobs.length },
          ...Object.entries(jobsByStatus).map(([status, count]) => ({
            Category: "",
            Metric: `Jobs - ${status}`,
            Value: count,
          })),
          { Category: "", Metric: "", Value: "" },
          { Category: "REVENUE BREAKDOWN", Metric: "", Value: "" },
          { Category: "", Metric: "Total Job Price", Value: `$${totalJobPrice.toFixed(2)}` },
          { Category: "", Metric: "Total Material Cost (Billing)", Value: `$${totalBillingMaterialCost.toFixed(2)}` },
          { Category: "", Metric: "Total Tax (6%)", Value: `$${totalTaxAmount.toFixed(2)}` },
          { Category: "", Metric: "TOTAL REVENUE", Value: `$${totalRevenue.toFixed(2)}` },
          { Category: "", Metric: "", Value: "" },
          { Category: "COSTS & PROFIT", Metric: "", Value: "" },
          { Category: "", Metric: "Total Internal Material Cost", Value: `$${totalInternalMaterialCost.toFixed(2)}` },
          { Category: "", Metric: "Gross Profit (Revenue - Internal Costs)", Value: `$${grossProfit.toFixed(2)}` },
          { Category: "", Metric: "", Value: "" },
          { Category: "PAYMENT STATUS", Metric: "", Value: "" },
          { Category: "", Metric: "Total Paid", Value: `$${totalPaidAmount.toFixed(2)}` },
          { Category: "", Metric: "Total Outstanding", Value: `$${totalOutstanding.toFixed(2)}` },
          { Category: "", Metric: "", Value: "" },
          { Category: "AVERAGES", Metric: "", Value: "" },
          { Category: "", Metric: "Average Job Price", Value: filteredJobs.length > 0 ? `$${(totalJobPrice / filteredJobs.length).toFixed(2)}` : "$0.00" },
          { Category: "", Metric: "Average Revenue per Job", Value: filteredJobs.length > 0 ? `$${(totalRevenue / filteredJobs.length).toFixed(2)}` : "$0.00" },
          { Category: "", Metric: "", Value: "" }
        );

        // Add detailed jobs sheet with comprehensive breakdown
        const jobsExportData = filteredJobs.map((job) => {
          const jobPrice = parseFloat(job.jobPrice) || 0;
          const billingMaterialCost = parseFloat(job.customMaterialCost) || 0;

          // Calculate internal material cost from job.sales
          let internalMaterialCost = 0;
          if (job.sales && Array.isArray(job.sales)) {
            job.sales.forEach((sale) => {
              if (sale.saleItems && Array.isArray(sale.saleItems)) {
                sale.saleItems.forEach((saleItem) => {
                  const unitPrice = parseFloat(saleItem.unitPrice || saleItem.product?.unitPrice || 0);
                  const quantity = parseInt(saleItem.quantity) || 1;
                  internalMaterialCost += unitPrice * quantity;
                });
              }
            });
          }

          const subtotal = jobPrice + billingMaterialCost;
          const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
          const totalCost = subtotal + taxAmount;
          const paidAmount = job.payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
          const outstanding = totalCost - paidAmount;

          return {
            "Job ID": job.id,
            Title: job.title,
            Customer: job.customer?.name || "",
            Status: job.status,
            "Payment Status": paidAmount >= totalCost ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID",
            "Start Date": job.startDate ? dayjs(job.startDate).format("YYYY-MM-DD") : "",
            "End Date": job.endDate ? dayjs(job.endDate).format("YYYY-MM-DD") : "",
            "Work Site": job.workSiteAddress || "",
            "Job Price": jobPrice,
            "Material Cost (Billing)": billingMaterialCost,
            "Internal Material Cost": internalMaterialCost,
            "Tax Included": job.includeTax ? "Yes" : "No",
            "Tax Amount": taxAmount,
            "Total Cost": totalCost,
            "Amount Paid": paidAmount,
            "Outstanding": outstanding,
          };
        });
        if (jobsExportData.length > 0) {
          const jobsSheet = XLSX.utils.json_to_sheet(jobsExportData);
          XLSX.utils.book_append_sheet(workbook, jobsSheet, "Jobs Detail");
          totalSheets++;
        }
      }

      // Customers Summary & Data
      if (selectedExportTypes.includes("customers")) {
        const filteredCustomers = customers.filter((c) => filterByDate(c.createdAt));

        summaryData.push(
          { Category: "CUSTOMERS SUMMARY", Metric: "", Value: "" },
          { Category: "", Metric: "Total Customers", Value: filteredCustomers.length },
          { Category: "", Metric: "New Customers (Period)", Value: filteredCustomers.length },
          { Category: "", Metric: "", Value: "" }
        );

        const customersData = filteredCustomers.map((customer) => ({
          "Customer ID": customer.id,
          Name: customer.name,
          Email: customer.email || "",
          Phone: customer.phone || "",
          Address: customer.addressLine1 || "",
          City: customer.city || "",
          State: customer.state || "",
        }));
        if (customersData.length > 0) {
          const customersSheet = XLSX.utils.json_to_sheet(customersData);
          XLSX.utils.book_append_sheet(workbook, customersSheet, "Customers Detail");
          totalSheets++;
        }
      }

      // Employees Summary & Data
      if (selectedExportTypes.includes("employees")) {
        const laborExpenses = expenses.filter(
          (e) => e.type === "LABOR" && filterByDate(e.expenseDate)
        );

        let totalHours = 0;
        let totalLaborCost = 0;
        const employeeStats = employees.map((employee) => {
          const employeeLabor = laborExpenses.filter(
            (e) => e.employeeName === employee.name
          );
          const hours = employeeLabor.reduce(
            (sum, e) => sum + (parseFloat(e.hoursWorked) || 0),
            0
          );
          const earnings = employeeLabor.reduce(
            (sum, e) => sum + (parseFloat(e.amount) || 0),
            0
          );
          totalHours += hours;
          totalLaborCost += earnings;
          return {
            "Employee ID": employee.id,
            Name: employee.name,
            Email: employee.email || "",
            Phone: employee.phone || "",
            "Total Hours": hours,
            "Total Earnings": earnings,
          };
        });

        summaryData.push(
          { Category: "EMPLOYEES SUMMARY", Metric: "", Value: "" },
          { Category: "", Metric: "Total Employees", Value: employees.length },
          { Category: "", Metric: "Total Hours Worked", Value: totalHours.toFixed(2) },
          { Category: "", Metric: "Total Labor Cost", Value: `$${totalLaborCost.toFixed(2)}` },
          { Category: "", Metric: "Average Hours/Employee", Value: employees.length > 0 ? (totalHours / employees.length).toFixed(2) : "0" },
          { Category: "", Metric: "", Value: "" }
        );

        if (employeeStats.length > 0) {
          const employeesSheet = XLSX.utils.json_to_sheet(employeeStats);
          XLSX.utils.book_append_sheet(workbook, employeesSheet, "Employees Detail");
          totalSheets++;
        }
      }

      // Expenses Summary & Data
      if (selectedExportTypes.includes("expenses")) {
        const filteredExpenses = expenses.filter((e) => filterByDate(e.expenseDate));
        const expensesByType = {};
        let totalExpenseAmount = 0;

        filteredExpenses.forEach((expense) => {
          const type = expense.type || "OTHER";
          expensesByType[type] = (expensesByType[type] || 0) + (parseFloat(expense.amount) || 0);
          totalExpenseAmount += parseFloat(expense.amount) || 0;
        });

        summaryData.push(
          { Category: "EXPENSES SUMMARY", Metric: "", Value: "" },
          { Category: "", Metric: "Total Expenses", Value: filteredExpenses.length },
          { Category: "", Metric: "Total Amount", Value: `$${totalExpenseAmount.toFixed(2)}` },
          ...Object.entries(expensesByType).map(([type, amount]) => ({
            Category: "",
            Metric: `${type}`,
            Value: `$${amount.toFixed(2)}`,
          })),
          { Category: "", Metric: "", Value: "" }
        );

        const expensesData = filteredExpenses.map((expense) => ({
          "Expense ID": expense.id,
          Date: expense.expenseDate ? dayjs(expense.expenseDate).format("YYYY-MM-DD") : "",
          Type: expense.type,
          Description: expense.description || "",
          Vendor: expense.vendor || "",
          Amount: parseFloat(expense.amount) || 0,
          Employee: expense.employeeName || "",
          Job: expense.jobTitle || "",
        }));
        if (expensesData.length > 0) {
          const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
          XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses Detail");
          totalSheets++;
        }
      }

      // Add summary sheet at the beginning
      if (summaryData.length > 0) {
        // Add header info
        const headerData = [
          { Category: "BUSINESS REPORT", Metric: "", Value: "" },
          { Category: "Company", Metric: companyName, Value: "" },
          { Category: "Period", Metric: `${startDate?.format("MMM D, YYYY")} - ${endDate?.format("MMM D, YYYY")}`, Value: "" },
          { Category: "Generated", Metric: dayjs().format("MMM D, YYYY h:mm A"), Value: "" },
          { Category: "", Metric: "", Value: "" },
        ];
        const summarySheet = XLSX.utils.json_to_sheet([...headerData, ...summaryData]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Move summary to first position
        const sheetOrder = workbook.SheetNames;
        const summaryIndex = sheetOrder.indexOf("Summary");
        if (summaryIndex > 0) {
          sheetOrder.splice(summaryIndex, 1);
          sheetOrder.unshift("Summary");
          workbook.SheetNames = sheetOrder;
        }
      }

      if (totalSheets === 0 && summaryData.length === 0) {
        message.warning("No data found for the selected date range");
        return;
      }

      const filename = `business-report-${startDate?.format("YYYY-MM-DD")}-to-${endDate?.format("YYYY-MM-DD")}.xlsx`;
      XLSX.writeFile(workbook, filename);

      message.success(`Report exported successfully with ${selectedExportTypes.length} section(s)`);
      setExportModalVisible(false);
    } catch (error) {
      console.error("Error exporting:", error);
      message.error("Failed to export data");
    }
  };

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
          <p className="mt-4 text-gray-600 text-lg">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Tab items
  const tabItems = [
    {
      key: "jobs",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Jobs
        </span>
      ),
      children: (
        <JobsView
          jobs={jobs}
          customers={customers}
          contracts={contracts}
          accountSettings={accountSettings}
          isLoading={jobsLoading}
        />
      ),
    },
    {
      key: "customers",
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Customers
        </span>
      ),
      children: (
        <CustomersView
          customers={customers}
          jobs={jobs}
          accountSettings={accountSettings}
          isLoading={customersLoading}
        />
      ),
    },
    {
      key: "employees",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Employees
        </span>
      ),
      children: (
        <EmployeesView
          employees={employees}
          expenses={expenses}
          isLoading={employeesLoading}
        />
      ),
    },
    {
      key: "expenses",
      label: (
        <span className="flex items-center gap-2">
          <DollarOutlined />
          Expenses
        </span>
      ),
      children: (
        <ExpensesView
          expenses={expenses}
          isLoading={expensesLoading}
        />
      ),
    },
  ];

  return (
    <div className="w-full" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {companyLogoUrl && (
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              style={{ height: 40, width: 40, objectFit: 'contain' }}
            />
          )}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {companyName}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Reports
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          onClick={() => setExportModalVisible(true)}
        >
          Export Report
        </Button>
      </div>

      {/* Main Tabs */}
      <Card size="small">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* Export Modal */}
      <Modal
        title="Export Business Report"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExport}
        okText="Export"
        okButtonProps={{ icon: <DownloadOutlined /> }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Select Data Types (Multiple)
          </Text>
          <Select
            mode="multiple"
            value={selectedExportTypes}
            onChange={setSelectedExportTypes}
            style={{ width: '100%' }}
            size="large"
            placeholder="Select one or more data types"
            maxTagCount={2}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
          >
            <Option value="jobs">
              <FileTextOutlined style={{ marginRight: 8 }} />
              Jobs
            </Option>
            <Option value="customers">
              <UserOutlined style={{ marginRight: 8 }} />
              Customers
            </Option>
            <Option value="employees">
              <TeamOutlined style={{ marginRight: 8 }} />
              Employees
            </Option>
            <Option value="expenses">
              <DollarOutlined style={{ marginRight: 8 }} />
              Expenses
            </Option>
          </Select>
          <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            Each selected type will have its own detail sheet plus a combined summary
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Date Range
          </Text>
          <RangePicker
            value={exportDateRange}
            onChange={setExportDateRange}
            style={{ width: '100%' }}
            size="large"
            placeholder={["Start Date", "End Date"]}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            Data will be filtered based on: Jobs (start date), Customers (creation date), Employees (labor within period), Expenses (expense date)
          </Text>
        </div>

        {selectedExportTypes.length > 0 && (
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Export will include:
            </Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Summary sheet with totals and calculations</li>
              {selectedExportTypes.includes("jobs") && (
                <li>Jobs: Revenue breakdown, billing & internal material costs, tax, payments, profit analysis</li>
              )}
              {selectedExportTypes.includes("customers") && (
                <li>Customers: Total count, contact details</li>
              )}
              {selectedExportTypes.includes("employees") && (
                <li>Employees: Hours worked, earnings, labor costs</li>
              )}
              {selectedExportTypes.includes("expenses") && (
                <li>Expenses: Breakdown by type, total amounts</li>
              )}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
