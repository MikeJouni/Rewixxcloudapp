import React from "react";

const JobInfoSection = ({ job, totalCost, onCompleteJob }) => {
  return (
    <div className="space-y-6">
      {/* First Row: Customer, Priority, Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Customer</h4>
          <p className="text-lg">{job.customerName || job.customer?.name || job.customer?.username || "Unknown Customer"}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Priority</h4>
          <span className={`text-lg font-medium ${
            job.priority === "LOW" ? "text-green-600" :
            job.priority === "MEDIUM" ? "text-yellow-600" :
            job.priority === "HIGH" ? "text-orange-600" :
            "text-red-600"
          }`}>
            {job.priority ? job.priority.charAt(0) + job.priority.slice(1).toLowerCase() : 'Unknown'}
          </span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Status</h4>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-medium ${
              job.status === "IN_PROGRESS" 
                ? "text-blue-600" 
                : "text-green-600"
            }`}>
              {job.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
            </span>
            {job.status === "IN_PROGRESS" && (
              <button
                onClick={onCompleteJob}
                className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition-colors"
              >
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Second Row: Start Date, End Date, Total Cost */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Start Date</h4>
          <p className="text-lg">{job.startDate ? new Date(job.startDate).toLocaleDateString() : "N/A"}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">End Date</h4>
          <p className="text-lg">{job.endDate ? new Date(job.endDate).toLocaleDateString() : "Not completed"}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Total Cost</h4>
          <p className="text-lg font-bold text-green-600">${totalCost.toFixed(2)}</p>
        </div>
      </div>
      
      {job.description && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
          <p className="text-gray-800">{job.description}</p>
        </div>
      )}
    </div>
  );
};

export default JobInfoSection;
