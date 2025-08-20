import React from "react";

const ReportGenerator = ({
  reportType,
  setReportType,
  selectedCustomerId,
  setSelectedCustomerId,
  selectedJobId,
  setSelectedJobId,
  customers,
  jobs,
  onGenerateReport
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type *
          </label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setSelectedCustomerId(null);
              setSelectedJobId(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="customer">Customer Report</option>
            <option value="job">Job Report</option>
          </select>
        </div>

        {/* Customer Selection (for Customer Reports) */}
        {reportType === "customer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId || ""}
              onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.username})
                </option>
              ))}
            </select>
            {selectedCustomerId && (
              <p className="text-sm text-gray-600 mt-1">
                Will show all jobs for this customer with cost analysis
              </p>
            )}
          </div>
        )}

        {/* Job Selection (for Job Reports) */}
        {reportType === "job" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job *
            </label>
            <select
              value={selectedJobId || ""}
              onChange={(e) => setSelectedJobId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.customer?.name || "No Customer"}
                </option>
              ))}
            </select>
            {selectedJobId && (
              <p className="text-sm text-gray-600 mt-1">
                Will show detailed job information with materials and cost breakdown
              </p>
            )}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-6">
        <button
          onClick={onGenerateReport}
          disabled={
            (reportType === "customer" && !selectedCustomerId) ||
            (reportType === "job" && !selectedJobId)
          }
          className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
            (reportType === "customer" && !selectedCustomerId) ||
            (reportType === "job" && !selectedJobId)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Generate Report
        </button>
      </div>

      {/* Report Description */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">What this report will show:</h3>
        {reportType === "customer" ? (
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Customer contact information and address</li>
            <li>• Summary of all jobs (total, completed, in progress, pending)</li>
            <li>• Total estimated vs actual hours</li>
            <li>• Total cost from all materials used</li>
            <li>• Detailed list of all jobs with status and costs</li>
          </ul>
        ) : (
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Job details and customer information</li>
            <li>• Estimated vs actual hours with efficiency calculation</li>
            <li>• Project duration calculation</li>
            <li>• Complete materials list with quantities and costs</li>
            <li>• Total project cost breakdown</li>
            <li>• Receipt count</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
