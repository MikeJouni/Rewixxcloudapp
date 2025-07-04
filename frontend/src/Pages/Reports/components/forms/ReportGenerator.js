import React from "react";

const ReportGenerator = ({
  reportType,
  setReportType,
  selectedCustomer,
  setSelectedCustomer,
  selectedJob,
  setSelectedJob,
  customers,
  jobs,
  onGenerateReport,
}) => {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Generate Report
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Report Type
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="customer">Customer Report</option>
          <option value="job">Job Report</option>
        </select>
      </div>

      {reportType === "customer" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Customer
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {reportType === "job" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Job
          </label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                #{job.id} - {job.title} ({job.customerName})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={onGenerateReport}
        disabled={
          !(
            (reportType === "customer" && selectedCustomer) ||
            (reportType === "job" && selectedJob)
          )
        }
      >
        Generate Report
      </button>
    </div>
  );
};

export default ReportGenerator;
