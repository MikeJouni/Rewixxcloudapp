import React, { useState } from "react";

const JobInfoSection = ({ job, totalCost, onCompleteJob, onUpdateJob }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(job.description || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [isEditingJobPrice, setIsEditingJobPrice] = useState(false);
  const [jobPrice, setJobPrice] = useState(job.jobPrice || "");
  const [isSavingJobPrice, setIsSavingJobPrice] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      console.log("Saving notes for job:", job.id, "Notes:", notes);
      const result = await onUpdateJob({ id: job.id, description: notes });
      console.log("Notes saved successfully:", result);
      
      // Update local job object with new notes
      job.description = notes;
      
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Failed to update notes:", error);
      alert("Failed to save notes: " + (error.response?.data || error.message));
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotes(job.description || "");
    setIsEditingNotes(false);
  };

  const handleSaveJobPrice = async () => {
    setIsSavingJobPrice(true);
    try {
      const priceValue = parseFloat(jobPrice) || 0;
      console.log("Saving job price for job:", job.id, "Price:", priceValue);
      const result = await onUpdateJob({ id: job.id, jobPrice: priceValue });
      console.log("Job price saved successfully:", result);
      
      // Update local job object with new price
      job.jobPrice = priceValue;
      
      setIsEditingJobPrice(false);
      
      // Force component to re-render
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to update job price:", error);
      alert("Failed to save job price: " + (error.response?.data || error.message));
    } finally {
      setIsSavingJobPrice(false);
    }
  };

  const handleCancelJobPrice = () => {
    setJobPrice(job.jobPrice || "");
    setIsEditingJobPrice(false);
  };

  // Financial data
  const materialCost = totalCost;
  const currentJobPrice = job.jobPrice || 0;
  const totalJobCost = materialCost + currentJobPrice;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* First Row: Customer, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Customer</h4>
          <p className="text-base sm:text-lg break-words">{job.customerName || job.customer?.name || job.customer?.username || "Unknown Customer"}</p>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Status</h4>
          <div className="flex items-center justify-between gap-2">
            <span 
              style={{
                backgroundColor: job.status === "IN_PROGRESS" ? '#EFF6FF' : '#ECFDF5',
                color: job.status === "IN_PROGRESS" ? '#1E40AF' : '#047857',
                border: job.status === "IN_PROGRESS" ? '1px solid #BFDBFE' : '1px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: job.status === "IN_PROGRESS" ? '#3B82F6' : '#10B981',
                display: 'inline-block'
              }} />
              {job.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
            </span>
            {job.status === "IN_PROGRESS" && (
              <button
                onClick={onCompleteJob}
                className="px-2 sm:px-3 py-1 bg-emerald-500 text-white rounded text-xs sm:text-sm hover:bg-emerald-600 transition-colors whitespace-nowrap"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Second Row: Start Date, End Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Start Date</h4>
          <p className="text-base sm:text-lg">{job.startDate ? new Date(job.startDate).toLocaleDateString() : "N/A"}</p>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">End Date</h4>
          <p className="text-base sm:text-lg">{job.endDate ? new Date(job.endDate).toLocaleDateString() : "Not completed"}</p>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div key={refreshKey} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Material Cost */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Material Cost</h4>
          <p className="text-base sm:text-lg font-bold text-gray-900">${materialCost.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-1">Total cost of materials</p>
        </div>

        {/* Job Price */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Job Price</h4>
            {!isEditingJobPrice && (
              <button
                onClick={() => setIsEditingJobPrice(true)}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                {job.jobPrice ? "Edit" : "Set"}
              </button>
            )}
          </div>
          {isEditingJobPrice ? (
            <div className="space-y-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={jobPrice}
                onChange={(e) => setJobPrice(e.target.value)}
                placeholder="0.00"
                className="w-full p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleSaveJobPrice}
                  disabled={isSavingJobPrice}
                  className={`px-2 py-1 rounded text-xs ${
                    isSavingJobPrice
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors`}
                >
                  {isSavingJobPrice ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelJobPrice}
                  disabled={isSavingJobPrice}
                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                ${currentJobPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Charge for labor and work</p>
            </>
          )}
        </div>

        {/* Total Cost */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 sm:col-span-2 md:col-span-1">
          <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Total Cost</h4>
          <p className="text-base sm:text-lg font-bold text-gray-900">${totalJobCost.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-1">Materials + Job Price</p>
        </div>
      </div>
      
      {/* Notes Section - Always visible and editable */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Notes</h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors"
            >
              {job.description ? "Edit" : "Add Notes"}
            </button>
          )}
        </div>
        
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this job..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[100px]"
              rows="4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className={`px-3 py-1 rounded text-sm ${
                  isSavingNotes
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white transition-colors`}
              >
                {isSavingNotes ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelNotes}
                disabled={isSavingNotes}
                className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-gray-800 break-words whitespace-pre-wrap">
            {job.description || "No notes added yet"}
          </p>
        )}
      </div>
    </div>
  );
};

export default JobInfoSection;
