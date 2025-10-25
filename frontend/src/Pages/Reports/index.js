import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from 'dayjs';
import { 
  Button, 
  Card, 
  DatePicker, 
  Space, 
  Typography, 
  Alert, 
  Spin, 
  Tabs, 
  Row, 
  Col, 
  Statistic,
  Table,
  Progress,
  Tag,
  Divider,
  Tooltip
} from "antd";
import { 
  DownloadOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  DollarOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from "@ant-design/icons";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";
import * as reportService from "./services/reportService";
import * as exportService from "./services/exportService";
import "./reports.css";
// Logo will be loaded from public directory

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Reports = () => {
  const [dateRange, setDateRange] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState("overview");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Set default date range to last 30 days
  useEffect(() => {
    const endDate = dayjs();
    const startDate = dayjs().subtract(30, 'day');
    setDateRange([startDate, endDate]);
  }, []);

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getCustomersList({ pageSize: 10000 }),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobService.getJobsList({ searchTerm: "", page: 0, pageSize: 10000, statusFilter: "All" }),
  });

  // Fetch comprehensive report data
  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ["comprehensive-report", dateRange],
    queryFn: () => {
      if (dateRange.length === 2) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        return reportService.reportService.getComprehensiveReport(startDate, endDate);
      }
      return null;
    },
    enabled: dateRange.length === 2,
  });

  const customers = customersData?.customers || [];
  const jobs = useMemo(() => jobsData?.jobs || [], [jobsData?.jobs]);

  // Calculate basic metrics from existing data
  const basicMetrics = useMemo(() => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS').length;
    const pendingJobs = jobs.filter(j => j.status === 'PENDING').length;
    const urgentJobs = jobs.filter(j => j.priority === 'URGENT').length;
    const highPriorityJobs = jobs.filter(j => j.priority === 'HIGH').length;
    
    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      pendingJobs,
      urgentJobs,
      highPriorityJobs,
      completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0
    };
  }, [jobs]);

  // Export functions
  const exportToPDF = async () => {
    setIsGeneratingReport(true);
    try {
      if (reportData) {
        const filename = `rewixx-report-${dateRange[0]?.format('YYYY-MM-DD') || 'start'}-${dateRange[1]?.format('YYYY-MM-DD') || 'end'}.pdf`;
        await exportService.exportToPDF(reportData, filename);
      } else {
        console.warn("No report data available for export");
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportToExcel = async () => {
    setIsGeneratingReport(true);
    try {
      if (reportData) {
        const filename = `rewixx-report-${dateRange[0]?.format('YYYY-MM-DD') || 'start'}-${dateRange[1]?.format('YYYY-MM-DD') || 'end'}.xlsx`;
        await exportService.exportToExcel(reportData, filename);
      } else {
        console.warn("No report data available for export");
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportToCSV = async () => {
    setIsGeneratingReport(true);
    try {
      if (reportData) {
        const filename = `rewixx-report-${dateRange[0]?.format('YYYY-MM-DD') || 'start'}-${dateRange[1]?.format('YYYY-MM-DD') || 'end'}.csv`;
        await exportService.exportToCSV(reportData, filename);
      } else {
        console.warn("No report data available for export");
      }
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (customersLoading || jobsLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 text-lg">Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Logo and Company Branding */}
        <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <img 
                src="/logo.png" 
                alt="Rewixx Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <Title level={1} className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-0">
                  Rewixx Reports Dashboard
            </Title>
                <Text className="text-gray-600 text-sm">
                  Comprehensive Business Intelligence & Analytics
            </Text>
              </div>
              </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                size="large"
                className="w-full sm:w-auto"
              />
              <Button 
                type="primary" 
                size="large"
                icon={<DownloadOutlined />}
                loading={isGeneratingReport}
                onClick={exportToPDF}
                style={{ 
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', 
                  border: 'none',
                }}
              >
                Export Report
              </Button>
              </div>
          </div>

          {/* Quick Stats Overview */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100">
                <Statistic
                  title="Total Jobs"
                  value={basicMetrics.totalJobs}
                  prefix={<FileTextOutlined className="text-blue-600" />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text className="text-xs text-gray-500">
                  {basicMetrics.inProgressJobs} in progress
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-100">
                <Statistic
                  title="Completed"
                  value={basicMetrics.completedJobs}
                  prefix={<CheckCircleOutlined className="text-green-600" />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text className="text-xs text-gray-500">
                  {basicMetrics.completionRate}% completion rate
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100">
                <Statistic
                  title="High Priority"
                  value={basicMetrics.highPriorityJobs}
                  prefix={<ExclamationCircleOutlined className="text-orange-600" />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <Text className="text-xs text-gray-500">
                  {basicMetrics.urgentJobs} urgent
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-purple-100">
                <Statistic
                  title="Customers"
                  value={customers.length}
                  prefix={<TeamOutlined className="text-purple-600" />}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Text className="text-xs text-gray-500">
                  Active clients
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Main Reports Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Tabs 
            activeKey={selectedReportType} 
            onChange={setSelectedReportType}
            className="reports-tabs"
            items={[
              {
                key: "overview",
                label: (
                  <span>
                    <BarChartOutlined />
                    Overview
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    {/* Revenue Overview */}
                    <Card title="💰 Revenue Analysis" className="bg-gradient-to-r from-green-50 to-emerald-50">
                      {reportData?.revenue ? (
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Total Revenue"
                              value={reportData.revenue.summary?.totalRevenue || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#52c41a' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Materials Cost"
                              value={reportData.revenue.summary?.totalMaterials || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Labor Cost"
                              value={reportData.revenue.summary?.totalLabor || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#fa8c16' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Net Profit"
                              value={(reportData.revenue.summary?.totalRevenue || 0) - 
                                    (reportData.revenue.summary?.totalMaterials || 0) - 
                                    (reportData.revenue.summary?.totalLabor || 0)}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Col>
                        </Row>
                      ) : (
                        <div className="text-center py-8">
                          <Spin />
                          <p className="mt-4 text-gray-500">Loading revenue data...</p>
                    </div>
                      )}
                    </Card>

                    {/* Labor Analysis */}
                    <Card title="⏰ Labor Analysis" className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      {reportData?.labor ? (
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Estimated Hours"
                              value={reportData.labor.summary?.totalEstimatedHours || 0}
                              suffix="hrs"
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Actual Hours"
                              value={reportData.labor.summary?.totalActualHours || 0}
                              suffix="hrs"
                              valueStyle={{ color: '#52c41a' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Efficiency"
                              value={reportData.labor.summary?.efficiency || 0}
                              suffix="%"
                              precision={1}
                              valueStyle={{ color: '#fa8c16' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Labor Cost"
                              value={reportData.labor.summary?.totalLaborCost || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Col>
                        </Row>
                      ) : (
                        <div className="text-center py-8">
                          <Spin />
                          <p className="mt-4 text-gray-500">Loading labor data...</p>
                      </div>
                      )}
                    </Card>

                    {/* Expenses Analysis */}
                    <Card title="💳 Expenses Analysis" className="bg-gradient-to-r from-orange-50 to-red-50">
                      {reportData?.expenses ? (
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Billable Expenses"
                              value={reportData.expenses.summary?.totalBillableExpenses || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#52c41a' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Non-Billable"
                              value={reportData.expenses.summary?.totalNonBillableExpenses || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#fa8c16' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Total Expenses"
                              value={reportData.expenses.summary?.totalExpenses || 0}
                              prefix="$"
                              precision={2}
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Billable Ratio"
                              value={reportData.expenses.summary?.billableRatio || 0}
                              suffix="%"
                              precision={1}
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Col>
                        </Row>
                      ) : (
                        <div className="text-center py-8">
                          <Spin />
                          <p className="mt-4 text-gray-500">Loading expenses data...</p>
                      </div>
                      )}
                    </Card>
                  </div>
                )
              },
              {
                key: "detailed",
                label: (
                  <span>
                    <FileTextOutlined />
                    Detailed Reports
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card 
                          title="📊 Revenue by Customer" 
                          className="h-full"
                          extra={
                            <Button type="link" size="small">
                              <DownloadOutlined /> Export
                            </Button>
                          }
                        >
                          {reportData?.revenue?.revenueByCustomer ? (
                            <Table
                              dataSource={Object.entries(reportData.revenue.revenueByCustomer).map(([customer, revenue]) => ({
                                key: customer,
                                customer,
                                revenue: `$${revenue.toFixed(2)}`
                              }))}
                              columns={[
                                { title: 'Customer', dataIndex: 'customer', key: 'customer' },
                                { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' }
                              ]}
                              pagination={false}
                              size="small"
                            />
                          ) : (
                            <div className="text-center py-4">
                              <Spin />
                              <p className="mt-2 text-gray-500">Loading customer revenue data...</p>
                  </div>
                )}
            </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card 
                          title="📈 Job Status Distribution" 
                          className="h-full"
                          extra={
                            <Button type="link" size="small">
                              <DownloadOutlined /> Export
                            </Button>
                          }
                        >
                          {reportData?.revenue?.jobsByStatus ? (
              <div className="space-y-3">
                              {Object.entries(reportData.revenue.jobsByStatus).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                  <Tag color={
                                    status === 'COMPLETED' ? 'green' :
                                    status === 'IN_PROGRESS' ? 'blue' :
                                    status === 'PENDING' ? 'orange' : 'default'
                                  }>
                                    {status}
                                  </Tag>
                                  <span className="font-medium">{count} jobs</span>
                                </div>
                              ))}
                    </div>
                          ) : (
                            <div className="text-center py-4">
                              <Spin />
                              <p className="mt-2 text-gray-500">Loading job status data...</p>
                  </div>
                )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: "insights",
                label: (
                  <span>
                    <RiseOutlined />
                    Business Insights
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    {reportData?.insights ? (
                      <>
                        <Card title="🎯 Key Performance Indicators">
                          <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title="Active Customers"
                                value={reportData.insights.overview?.activeCustomers || 0}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title="Total Revenue"
                                value={reportData.insights.overview?.totalRevenue || 0}
                                prefix="$"
                                precision={2}
                                valueStyle={{ color: '#52c41a' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title="Efficiency"
                                value={reportData.insights.efficiency?.efficiency || 0}
                                suffix="%"
                                precision={1}
                                valueStyle={{ color: '#fa8c16' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title="Completion Rate"
                                value={reportData.insights.overview?.totalJobs > 0 ? 
                                  Math.round((reportData.insights.overview.completedJobs / reportData.insights.overview.totalJobs) * 100) : 0}
                                suffix="%"
                                valueStyle={{ color: '#722ed1' }}
                              />
                            </Col>
                          </Row>
                        </Card>

                        <Card title="🏆 Top Customers by Revenue">
                          {reportData.insights.topCustomers ? (
                            <Table
                              dataSource={Object.entries(reportData.insights.topCustomers).map(([customer, revenue], index) => ({
                                key: customer,
                                rank: index + 1,
                                customer,
                                revenue: `$${revenue.toFixed(2)}`
                              }))}
                              columns={[
                                { title: 'Rank', dataIndex: 'rank', key: 'rank', width: 60 },
                                { title: 'Customer', dataIndex: 'customer', key: 'customer' },
                                { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' }
                              ]}
                              pagination={false}
                              size="small"
                            />
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500">No customer data available</p>
                  </div>
                )}
                        </Card>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Spin />
                        <p className="mt-4 text-gray-500">Loading business insights...</p>
                  </div>
                )}
              </div>
                )
              }
            ]}
          />
          </Card>

        {/* Export Options */}
        <Card className="mt-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Title level={3} className="text-center mb-6">
            📤 Export Options
                </Title>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={8} md={6}>
                <Button
                type="primary"
                size="large"
                icon={<FileTextOutlined />}
                onClick={exportToPDF}
                loading={isGeneratingReport}
                className="w-full h-16"
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                  border: 'none',
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">PDF Report</span>
                  <span className="text-xs opacity-80">Professional Format</span>
                </div>
              </Button>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Button 
                type="primary"
                size="large" 
                icon={<BarChartOutlined />}
                onClick={exportToExcel}
                loading={isGeneratingReport}
                className="w-full h-16"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none',
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">Excel Report</span>
                  <span className="text-xs opacity-80">Spreadsheet Format</span>
                </div>
                </Button>
            </Col>
            <Col xs={24} sm={8} md={6}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                onClick={exportToCSV}
                loading={isGeneratingReport}
                className="w-full h-16"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  border: 'none',
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">CSV Data</span>
                  <span className="text-xs opacity-80">Raw Data Export</span>
                </div>
                </Button>
            </Col>
          </Row>
            </Card>
    </div>
  );
};

export default Reports;