import React from "react";

const ReportDisplay = ({ report, onExport }) => {
  if (!report) return null;

  const formatStatus = (status) => {
    const statusMap = {
      "PENDING": { text: "Pending", color: "bg-yellow-100 text-yellow-800" },
      "IN_PROGRESS": { text: "In Progress", color: "bg-blue-100 text-blue-800" },
      "COMPLETED": { text: "Completed", color: "bg-green-100 text-green-800" },
      "CANCELLED": { text: "Cancelled", color: "bg-red-100 text-red-800" }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatPriority = (priority) => {
    const priorityMap = {
      "LOW": { text: "Low", color: "text-green-600" },
      "MEDIUM": { text: "Medium", color: "text-yellow-600" },
      "HIGH": { text: "High", color: "text-orange-600" },
      "URGENT": { text: "Urgent", color: "text-red-600" }
    };
    
    const priorityInfo = priorityMap[priority] || { text: priority, color: "text-gray-600" };
    return (
      <span className={`font-semibold ${priorityInfo.color}`}>
        {priorityInfo.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{report.type}</h2>
        <button
          onClick={() => onExport(report)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          📊 Export CSV
        </button>
      </div>

      {report.type === "Customer Report" && (
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{report.customer.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{report.customer.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{report.customer.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-900">{report.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-blue-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.summary.totalJobs}</div>
                <div className="text-sm text-blue-700">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.summary.completedJobs}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.summary.inProgressJobs}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.pendingJobs}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{report.summary.totalEstimatedHours}h</div>
                <div className="text-sm text-blue-700">Estimated Hours</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{report.summary.totalActualHours}h</div>
                <div className="text-sm text-green-700">Actual Hours</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">${report.summary.totalCost}</div>
                <div className="text-sm text-purple-700">Total Cost</div>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Jobs List</h3>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Act Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{job.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatStatus(job.status)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatPriority(job.priority)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.startDate || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.endDate || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.estimatedHours}h</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.actualHours}h</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${job.totalCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {report.jobs.map((job) => (
                <div key={job.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {/* Header with ID, Title, Cost */}
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-gray-500">Job #{job.id}</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{job.title}</div>
                      </div>
                      <div className="text-right text-lg font-bold text-gray-900">
                        ${job.totalCost}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formatStatus(job.status)}
                      {formatPriority(job.priority)}
                    </div>
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Start Date</div>
                      <div className="text-sm text-gray-900">{job.startDate || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">End Date</div>
                      <div className="text-sm text-gray-900">{job.endDate || "N/A"}</div>
                    </div>
                  </div>

                  {/* Hours Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Est Hours</div>
                      <div className="text-sm font-medium text-gray-900">{job.estimatedHours}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Act Hours</div>
                      <div className="text-sm font-medium text-gray-900">{job.actualHours}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report.type === "Job Report" && (
        <div className="space-y-6">
          {/* Job Information */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{report.job.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Customer:</span>
                <span className="ml-2 text-gray-900">{report.job.customerName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">{formatStatus(report.job.status)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Priority:</span>
                <span className="ml-2">{formatPriority(report.job.priority)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Start Date:</span>
                <span className="ml-2 text-gray-900">{report.job.startDate || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Date:</span>
                <span className="ml-2 text-gray-900">{report.job.endDate || "N/A"}</span>
              </div>
            </div>
            {report.job.description && (
              <div className="mt-4">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-900">{report.job.description}</p>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="bg-blue-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Project Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.summary.estimatedHours}h</div>
                <div className="text-sm text-blue-700">Estimated Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.summary.actualHours}h</div>
                <div className="text-sm text-green-700">Actual Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{report.summary.efficiency}</div>
                <div className="text-sm text-purple-700">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{report.summary.duration}</div>
                <div className="text-sm text-orange-700">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">${report.summary.totalCost}</div>
                <div className="text-sm text-red-700">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{report.summary.totalMaterials}</div>
                <div className="text-sm text-indigo-700">Materials</div>
              </div>
            </div>
          </div>

          {/* Materials List */}
          {report.materials.length > 0 && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Materials Used</h3>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.materials.map((material, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{material.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${material.unitPrice}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${material.total}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{material.notes || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {report.materials.map((material, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {/* Header with Material Name and Total */}
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                      <div className="flex-1 pr-2">
                        <div className="text-base font-semibold text-gray-900">{material.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Total</div>
                        <div className="text-lg font-bold text-gray-900">${material.total}</div>
                      </div>
                    </div>

                    {/* Quantity and Unit Price Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Quantity</div>
                        <div className="text-sm font-medium text-gray-900">{material.quantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Unit Price</div>
                        <div className="text-sm font-medium text-gray-900">${material.unitPrice}</div>
                      </div>
                    </div>

                    {/* Notes */}
                    {material.notes && material.notes !== "N/A" && (
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Notes</div>
                        <div className="text-sm text-gray-900">{material.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-green-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-green-700">Receipts Attached:</span>
                <span className="ml-2 text-green-900">{report.receipts} receipt(s)</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Report Generated:</span>
                <span className="ml-2 text-green-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
