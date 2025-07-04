import React from "react";

const JobTable = ({
  jobs,
  onViewDetails,
  onEdit,
  onDelete,
  onReceiptUpload,
  processingReceipt = false,
  isMobile = false,
}) => {
  if (jobs.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        No jobs found matching your criteria.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours (Est/Act)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {job.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : job.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : job.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      job.priority === "Low"
                        ? "text-green-600"
                        : job.priority === "Medium"
                        ? "text-yellow-600"
                        : job.priority === "High"
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {job.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.startDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.endDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.estimatedHours} / {job.actualHours}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${job.totalCost?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.receipts ? job.receipts.length : 0} attached
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => onViewDetails(job)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(job)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    {isMobile && (
                      <label
                        className={`px-2 py-1 text-xs text-white border-none rounded cursor-pointer ${
                          processingReceipt
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {processingReceipt ? "Processing..." : "Attach Receipt"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onReceiptUpload(job.id, e)}
                          className="hidden"
                          disabled={processingReceipt}
                        />
                      </label>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;
