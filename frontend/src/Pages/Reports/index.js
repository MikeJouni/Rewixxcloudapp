import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, DatePicker, Space, Typography, Alert, Spin } from "antd";
import { DownloadOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";

const { Title, Text } = Typography;

const Reports = () => {
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [jobsStartDate, setJobsStartDate] = useState("");
  const [jobsEndDate, setJobsEndDate] = useState("");
  const [jobsModalError, setJobsModalError] = useState("");
  const [reportParams, setReportParams] = useState(null); // { startDate, endDate }
  const [showPrintArea, setShowPrintArea] = useState(false);
  const printRef = useRef(null);

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getCustomersList({ pageSize: 10000 }),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobService.getJobsList({ searchTerm: "", page: 0, pageSize: 10000, statusFilter: "All" }),
  });

  const customers = customersData?.customers || [];
  const jobs = useMemo(() => jobsData?.jobs || [], [jobsData?.jobs]);

  const filteredJobs = useMemo(() => {
    if (!reportParams?.startDate && !reportParams?.endDate) return jobs;
    const start = reportParams?.startDate ? new Date(reportParams.startDate) : null;
    const end = reportParams?.endDate ? new Date(reportParams.endDate) : null;
    return jobs.filter((job) => {
      const dateStr = job.endDate || job.startDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      if (start && d < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [jobs, reportParams]);

  const calculateJobCost = (job) => {
    let jobCost = 0;
    if (job?.sales && Array.isArray(job.sales)) {
      job.sales.forEach((sale) => {
        if (sale?.saleItems && Array.isArray(sale.saleItems)) {
          sale.saleItems.forEach((item) => {
            const unit = Number(item?.unitPrice) || 0;
            const qty = Number(item?.quantity) || 0;
            jobCost += unit * qty;
          });
        }
      });
    }
    return jobCost;
  };

  const totalJobsCost = useMemo(() => {
    return filteredJobs.reduce((sum, j) => sum + calculateJobCost(j), 0);
  }, [filteredJobs]);

  const ensureHtml2PdfLoaded = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-html2pdf]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.defer = true;
      script.setAttribute('data-html2pdf', 'true');
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const makeFileName = () => {
    const start = reportParams?.startDate || "all";
    const end = reportParams?.endDate || "dates";
    return `jobs_${start}-${end}.pdf`;
  };

  const generatePdfDownload = async () => {
    if (!printRef.current) return;
    await ensureHtml2PdfLoaded();
    const opt = {
      margin: 10,
      filename: makeFileName(),
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    };
    window.html2pdf().set(opt).from(printRef.current).save();
  };

  const exportAllCustomersCsv = () => {
    if (!customers || customers.length === 0) return;

    // Precompute total spend per customer from all jobs
    const customerIdToSpend = new Map();
    jobs.forEach((job) => {
      const customerId = job?.customer?.id;
      if (!customerId) return;
      const cost = calculateJobCost(job);
      customerIdToSpend.set(customerId, (customerIdToSpend.get(customerId) || 0) + cost);
    });

    let csv = "ID,Name,Username,Phone,Address 1,Address 2,City,State,ZIP,Total Spend\n";
    customers.forEach((c) => {
      const totalSpend = customerIdToSpend.get(c.id) || 0;
      const row = [
        c.id ?? "",
        (c.name ?? "").toString().replace(/"/g, '""'),
        (c.username ?? "").toString().replace(/"/g, '""'),
        (c.phone ?? "").toString().replace(/"/g, '""'),
        (c.addressLine1 ?? "").toString().replace(/"/g, '""'),
        (c.addressLine2 ?? "").toString().replace(/"/g, '""'),
        (c.city ?? "").toString().replace(/"/g, '""'),
        (c.state ?? "").toString().replace(/"/g, '""'),
        (c.zip ?? "").toString().replace(/"/g, '""'),
        `$${totalSpend.toFixed(2)}`,
      ];
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `customers_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // After setting report params from modal, temporarily show print area and trigger PDF download
  useEffect(() => {
    if (reportParams) {
      setShowPrintArea(true);
      const t = setTimeout(async () => {
        await generatePdfDownload();
        // Hide after a short delay to ensure capture completed
        setTimeout(() => setShowPrintArea(false), 300);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [reportParams]);

  // Validate jobs date range inside modal
  const validateJobsModal = () => {
    setJobsModalError("");
    if (!jobsStartDate || !jobsEndDate) {
      setJobsModalError("Please select both start and end dates.");
      return false;
    }
    const start = new Date(jobsStartDate);
    const end = new Date(jobsEndDate);
    if (start > end) {
      setJobsModalError("Start date cannot be after end date.");
      return false;
    }
    // Check if there are jobs in the given range
    const hasJobs = jobs.some((job) => {
      const dateStr = job.endDate || job.startDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      return d >= start && d <= endOfDay;
    });
    if (!hasJobs) {
      setJobsModalError("No jobs found in this date range.");
      return false;
    }
    return true;
  };

  if (customersLoading || jobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-600 text-lg">Loading reports data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6 shadow-lg">
          <div className="text-center mb-8">
            <Title level={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              📊 Reports Dashboard
            </Title>
            <Text className="text-base sm:text-lg text-gray-600">
              Generate comprehensive reports and export data for analysis
            </Text>
          </div>

          {/* Business Insights Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="text-center border-l-4 border-l-blue-500">
              <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
              <div className="text-xs text-gray-500 mt-1">
                {jobs.filter(j => j.status === 'IN_PROGRESS').length} in progress
              </div>
            </Card>
            <Card className="text-center border-l-4 border-l-green-500">
              <div className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600">Completed Jobs</div>
              <div className="text-xs text-gray-500 mt-1">
                {jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'COMPLETED').length / jobs.length) * 100) : 0}% completion rate
              </div>
            </Card>
            <Card className="text-center border-l-4 border-l-orange-500">
              <div className="text-2xl font-bold text-orange-600">
                {jobs.filter(j => j.priority === 'URGENT' || j.priority === 'HIGH').length}
              </div>
              <div className="text-sm text-gray-600">High Priority Jobs</div>
              <div className="text-xs text-gray-500 mt-1">
                {jobs.filter(j => j.priority === 'URGENT').length} urgent
              </div>
            </Card>
            <Card className="text-center border-l-4 border-l-purple-500">
              <div className="text-2xl font-bold text-purple-600">
                {customers.length}
              </div>
              <div className="text-sm text-gray-600">Total Customers</div>
              <div className="text-xs text-gray-500 mt-1">
                {customers.filter(c => c.jobs && c.jobs.length > 0).length} with active jobs
              </div>
            </Card>
          </div>

          {/* Recent Activity & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card title="📋 Recent Job Activity" className="h-full">
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-600">{job.customer?.name || 'Unknown Customer'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                        job.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        job.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        job.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.priority}
                      </div>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No jobs found. Create your first job to get started!
                  </div>
                )}
              </div>
            </Card>

            <Card title="⚡ Priority Alerts" className="h-full">
              <div className="space-y-3">
                {jobs.filter(j => j.priority === 'URGENT').length > 0 && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="font-medium text-red-800">🚨 Urgent Jobs</div>
                    <div className="text-sm text-red-600">
                      {jobs.filter(j => j.priority === 'URGENT').length} jobs need immediate attention
                    </div>
                  </div>
                )}
                {jobs.filter(j => j.status === 'IN_PROGRESS' && j.priority === 'HIGH').length > 0 && (
                  <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                    <div className="font-medium text-orange-800">⚠️ High Priority</div>
                    <div className="text-sm text-orange-600">
                      {jobs.filter(j => j.status === 'IN_PROGRESS' && j.priority === 'HIGH').length} jobs in progress
                    </div>
                  </div>
                )}
                {jobs.filter(j => j.status === 'COMPLETED').length > 0 && (
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="font-medium text-green-800">✅ Completed</div>
                    <div className="text-sm text-green-600">
                      {jobs.filter(j => j.status === 'COMPLETED').length} jobs finished this period
                    </div>
                  </div>
                )}
                {jobs.filter(j => j.priority === 'URGENT').length === 0 && 
                 jobs.filter(j => j.status === 'IN_PROGRESS' && j.priority === 'HIGH').length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No priority alerts. Great job staying on top of things! 🎉
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Materials & Inventory Insights */}
          <Card title="🔧 Materials & Inventory Overview" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {jobs.reduce((total, job) => {
                    if (job?.sales && Array.isArray(job.sales)) {
                      return total + job.sales.reduce((saleTotal, sale) => {
                        if (sale?.saleItems && Array.isArray(sale.saleItems)) {
                          return saleTotal + sale.saleItems.reduce((itemTotal, item) => itemTotal + (Number(item?.quantity) || 0), 0);
                        }
                        return saleTotal;
                      }, 0);
                    }
                    return total;
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Materials Used</div>
                <div className="text-xs text-gray-500 mt-1">Across all jobs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(jobs.flatMap(job => 
                    job?.sales?.flatMap(sale => 
                      sale?.saleItems?.map(item => item?.product?.name).filter(Boolean)
                    ) || []
                  )).size}
                </div>
                <div className="text-sm text-gray-600">Unique Products</div>
                <div className="text-xs text-gray-500 mt-1">Different materials tracked</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {jobs.filter(job => 
                    job?.sales?.some(sale => 
                      sale?.saleItems?.some(item => item?.product?.name)
                    )
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Jobs with Materials</div>
                <div className="text-xs text-gray-500 mt-1">Projects with tracked inventory</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card 
              hoverable 
              className="border-2 border-blue-100 hover:border-blue-300 transition-all duration-300"
            >
              <div className="text-center">
                <FileTextOutlined className="text-4xl text-blue-600 mb-4" />
                <Title level={3} className="text-xl font-semibold text-gray-900 mb-2">
                  Jobs PDF Report
                </Title>
                <Text className="text-gray-600 mb-6 block">
                  Create professional PDF reports with job details, materials used, customer information, and project timelines for client presentations and record keeping
                </Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={() => { setJobsModalError(""); setShowJobsModal(true); }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                >
                  Generate PDF Report
                </Button>
              </div>
            </Card>

            <Card 
              hoverable 
              className="border-2 border-green-100 hover:border-green-300 transition-all duration-300"
            >
              <div className="text-center">
                <UserOutlined className="text-4xl text-green-600 mb-4" />
                <Title level={3} className="text-xl font-semibold text-gray-900 mb-2">
                  Customer Data Export
                </Title>
                <Text className="text-gray-600 mb-6 block">
                  Export customer database with contact information, job history, and service records for CRM integration and customer relationship management
                </Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={exportAllCustomersCsv}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                >
                  Export CSV
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Actions for Electrical Contractors */}
          <Card title="⚡ Quick Actions" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                type="default" 
                size="large" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/jobs/create'}
              >
                <div className="text-2xl mb-2">➕</div>
                <div className="text-sm">New Job</div>
              </Button>
              <Button 
                type="default" 
                size="large" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/customers/create'}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm">Add Customer</div>
              </Button>
              <Button 
                type="default" 
                size="large" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/jobs'}
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm">View Jobs</div>
              </Button>
              <Button 
                type="default" 
                size="large" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/customers'}
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm">View Customers</div>
              </Button>
        </div>
          </Card>
        </Card>

        {/* Off-screen printable content used for PDF generation */}
        {showPrintArea && (
          <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '210mm', background: '#fff', padding: '24px' }}>
            <style>
              {`
                h1 { margin: 0 0 12px; }
                h2 { margin: 18px 0 8px; }
                .muted { color: #6b7280; }
                .section { margin-top: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; }
                th { background: #f9fafb; text-align: left; }
              `}
            </style>
            <div ref={printRef}>
              <h1>Jobs Report</h1>
              <p className="muted">
                {reportParams?.startDate || reportParams?.endDate ? `${reportParams?.startDate || '...'} to ${reportParams?.endDate || '...'}` : 'All dates'}
              </p>

              {/* Summary */}
              <div className="section">
                <h2>Summary</h2>
                <table>
                  <tbody>
                    <tr>
                      <td>Total Jobs</td>
                      <td>{filteredJobs.length}</td>
                    </tr>
                    <tr>
                      <td>Total Cost</td>
                      <td>${totalJobsCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Completed Jobs</td>
                      <td>{filteredJobs.filter(j => j.status === 'COMPLETED').length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Job details */}
              <div className="section">
                <h2>Jobs</h2>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>{job.title}</td>
                        <td>{job.customer?.name || job.customerName || ''}</td>
                        <td>{job.status}</td>
                        <td>{job.priority}</td>
                        <td>{job.startDate || ''}</td>
                        <td>{job.endDate || ''}</td>
                        <td>${calculateJobCost(job).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Materials section - always included */}
              <div className="section">
                <h2>Materials</h2>
                {filteredJobs.map((job) => {
                  const materials = [];
                  if (job?.sales && Array.isArray(job.sales)) {
                    job.sales.forEach((sale) => {
                      if (sale?.saleItems && Array.isArray(sale.saleItems)) {
                        sale.saleItems.forEach((item) => {
                          materials.push({
                            name: item?.product?.name || 'Unknown',
                            quantity: item?.quantity || 0,
                            unitPrice: Number(item?.unitPrice) || 0,
                            total: ((Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 0)).toFixed(2),
                          });
                        });
                      }
                    });
                  }
                  if (materials.length === 0) return null;
                  return (
                    <div key={`materials-${job.id}`} className="section">
                      <h3>Job #{job.id} - {job.title}</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m, idx) => (
                            <tr key={idx}>
                              <td>{m.name}</td>
                              <td>{m.quantity}</td>
                              <td>${m.unitPrice.toFixed(2)}</td>
                              <td>${m.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Jobs PDF modal */}
        {showJobsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <Title level={3} className="text-xl font-semibold mb-0">Generate PDF Report</Title>
                <Button 
                  type="text" 
                  onClick={() => setShowJobsModal(false)}
                  className="text-2xl p-0 h-auto text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Text strong className="block mb-2">Start Date</Text>
                  <DatePicker
                    value={jobsStartDate ? new Date(jobsStartDate) : null}
                    onChange={(date) => { 
                      setJobsStartDate(date ? date.format('YYYY-MM-DD') : ''); 
                      setJobsModalError(""); 
                    }}
                    className="w-full"
                    size="large"
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <Text strong className="block mb-2">End Date</Text>
                  <DatePicker
                    value={jobsEndDate ? new Date(jobsEndDate) : null}
                    onChange={(date) => { 
                      setJobsEndDate(date ? date.format('YYYY-MM-DD') : ''); 
                      setJobsModalError(""); 
                    }}
                    className="w-full"
                    size="large"
                    placeholder="Select end date"
                  />
                </div>
                {jobsModalError && (
                  <Alert
                    message={jobsModalError}
                    type="error"
                    showIcon
                    className="w-full"
                  />
                )}
              </Space>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <Button 
                  size="large"
                  onClick={() => setShowJobsModal(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (!validateJobsModal()) return;
                    setReportParams({ startDate: jobsStartDate, endDate: jobsEndDate });
                    setShowJobsModal(false);
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                >
                  Generate PDF
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;