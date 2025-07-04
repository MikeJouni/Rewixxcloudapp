import React from "react";

const ReportDisplay = ({ report, onExport }) => {
  if (!report) return null;

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{report.type}</h3>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer text-sm hover:bg-green-600 transition-colors"
        >
          Export
        </button>
      </div>

      {report.type === "Customer Report" && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {report.customer.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {report.customer.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {report.customer.phone}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.summary.totalJobs}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.summary.completedJobs}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {report.summary.inProgressJobs}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {report.summary.pendingJobs}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Est. Hours</p>
                <p className="text-2xl font-bold text-purple-600">
                  {report.summary.totalEstimatedHours}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Act. Hours</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {report.summary.totalActualHours}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Jobs</h4>
            <div className="space-y-2">
              {report.jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex justify-between items-center p-2 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-gray-600">
                      Status: {job.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Est: {job.estimatedHours}h</p>
                    <p className="text-sm">Act: {job.actualHours}h</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report.type === "Job Report" && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">
              Job Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">Title:</span> {report.job.title}
              </p>
              <p>
                <span className="font-medium">Customer:</span>{" "}
                {report.job.customerName}
              </p>
              <p>
                <span className="font-medium">Status:</span> {report.job.status}
              </p>
              <p>
                <span className="font-medium">Start Date:</span>{" "}
                {report.job.startDate}
              </p>
              <p>
                <span className="font-medium">End Date:</span>{" "}
                {report.job.endDate}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Estimated Hours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.summary.estimatedHours}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Actual Hours</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.summary.actualHours}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {report.summary.efficiency}%
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-purple-600">
                  {report.summary.duration} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
