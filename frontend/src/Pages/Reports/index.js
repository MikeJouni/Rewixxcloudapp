import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";

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
  const jobs = jobsData?.jobs || [];

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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">Generate a jobs PDF with details and totals, or export all customers as CSV.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setJobsModalError(""); setShowJobsModal(true); }}
              className="w-full px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-left"
            >
              <span className="block text-lg font-semibold">Download Jobs PDF</span>
              <span className="block text-sm text-blue-100">Pick date range and download</span>
            </button>
            <button
              onClick={exportAllCustomersCsv}
              className="w-full px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-left"
            >
              <span className="block text-lg font-semibold">Export Customers CSV</span>
              <span className="block text-sm text-green-100">Shows details about customers such as contacts and totals</span>
            </button>
          </div>
        </div>

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
            <div className="bg-white rounded-lg w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Download Jobs PDF</h3>
                <button className="text-2xl leading-none text-gray-500" onClick={() => setShowJobsModal(false)}>×</button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                  <input type="date" value={jobsStartDate} onChange={(e) => { setJobsStartDate(e.target.value); setJobsModalError(""); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                  <input type="date" value={jobsEndDate} onChange={(e) => { setJobsEndDate(e.target.value); setJobsModalError(""); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {jobsModalError && (
                  <p className="text-sm text-red-600">{jobsModalError}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-200 rounded-md" onClick={() => setShowJobsModal(false)}>Cancel</button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => {
                    if (!validateJobsModal()) return;
                    setReportParams({ startDate: jobsStartDate, endDate: jobsEndDate });
                    setShowJobsModal(false);
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;