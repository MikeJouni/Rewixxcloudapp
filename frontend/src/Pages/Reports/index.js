import React from "react";
import ReportGenerator from "./components/forms/ReportGenerator";
import ReportDisplay from "./components/tables/ReportDisplay";
import useReports from "./hooks/useReports";

const ReportsPage = () => {
  const {
    reportType,
    setReportType,
    selectedCustomer,
    setSelectedCustomer,
    selectedJob,
    setSelectedJob,
    customers,
    jobs,
    generatedReport,
    showReport,
    generateReport,
    exportReport,
  } = useReports();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Report Generation Panel */}
        <ReportGenerator
          reportType={reportType}
          setReportType={setReportType}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob}
          customers={customers}
          jobs={jobs}
          onGenerateReport={generateReport}
        />

        {/* Report Display Panel */}
        {showReport && (
          <ReportDisplay report={generatedReport} onExport={exportReport} />
        )}
      </div>

      {/* Additional Report Options - Will be refactored to separate components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Quick Reports
          </h3>
          <p className="text-gray-600 text-sm">
            Quick report options will be refactored to separate components
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Analytics
          </h3>
          <p className="text-gray-600 text-sm">
            Analytics dashboard will be refactored to separate components
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Export Options
          </h3>
          <p className="text-gray-600 text-sm">
            Export functionality will be refactored to separate components
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
