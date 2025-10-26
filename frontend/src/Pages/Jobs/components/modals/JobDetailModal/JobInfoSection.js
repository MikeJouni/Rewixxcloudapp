import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const JobInfoSection = forwardRef(({ job, totalCost, onCompleteJob, onUpdateJob }, ref) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(job.description || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [jobPrice, setJobPrice] = useState(job.jobPrice || "");
  const [isSavingJobPrice, setIsSavingJobPrice] = useState(false);
  
  const [customMaterialCost, setCustomMaterialCost] = useState(job.customMaterialCost || "");
  const [isSavingMaterialCost, setIsSavingMaterialCost] = useState(false);
  
  const [includeTax, setIncludeTax] = useState(job.includeTax || false);
  const [isSavingTax, setIsSavingTax] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Track if there are unsaved changes
  const hasUnsavedMaterialCost = useRef(false);
  const hasUnsavedJobPrice = useRef(false);
  
  // Save any pending changes when component unmounts or modal closes
  useEffect(() => {
    return () => {
      // Save material cost if there are unsaved changes
      if (hasUnsavedMaterialCost.current) {
        const costValue = parseFloat(customMaterialCost) || 0;
        if (costValue !== (job.customMaterialCost || 0)) {
          onUpdateJob({ id: job.id, customMaterialCost: costValue });
        }
      }
      // Save job price if there are unsaved changes
      if (hasUnsavedJobPrice.current) {
        const priceValue = parseFloat(jobPrice) || 0;
        if (priceValue !== (job.jobPrice || 0)) {
          onUpdateJob({ id: job.id, jobPrice: priceValue });
        }
      }
    };
  }, [customMaterialCost, jobPrice, job.id, job.customMaterialCost, job.jobPrice, onUpdateJob]);

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

  const handleJobPriceBlur = async () => {
    const priceValue = parseFloat(jobPrice) || 0;
    
    // Only save if value changed
    if (priceValue === (job.jobPrice || 0)) {
      hasUnsavedJobPrice.current = false;
      return;
    }
    
    setIsSavingJobPrice(true);
    try {
      console.log("Auto-saving job price for job:", job.id, "Price:", priceValue);
      const result = await onUpdateJob({ id: job.id, jobPrice: priceValue });
      console.log("Job price saved successfully:", result);
      
      // Update local job object with new price
      job.jobPrice = priceValue;
      hasUnsavedJobPrice.current = false;
      
      // Force component to re-render
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to update job price:", error);
      alert("Failed to save job price: " + (error.response?.data || error.message));
      // Revert to original value on error
      setJobPrice(job.jobPrice || "");
      hasUnsavedJobPrice.current = false;
    } finally {
      setIsSavingJobPrice(false);
    }
  };

  const handleMaterialCostBlur = async () => {
    const costValue = parseFloat(customMaterialCost) || 0;
    
    // Only save if value changed
    if (costValue === (job.customMaterialCost || 0)) {
      hasUnsavedMaterialCost.current = false;
      return;
    }
    
    setIsSavingMaterialCost(true);
    try {
      console.log("Auto-saving custom material cost for job:", job.id, "Cost:", costValue);
      const result = await onUpdateJob({ id: job.id, customMaterialCost: costValue });
      console.log("Material cost saved successfully:", result);
      
      job.customMaterialCost = costValue;
      hasUnsavedMaterialCost.current = false;
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to update material cost:", error);
      alert("Failed to save material cost: " + (error.response?.data || error.message));
      // Revert to original value on error
      setCustomMaterialCost(job.customMaterialCost || "");
      hasUnsavedMaterialCost.current = false;
    } finally {
      setIsSavingMaterialCost(false);
    }
  };

  const handleToggleTax = async (checked) => {
    setIsSavingTax(true);
    try {
      console.log("Updating tax setting for job:", job.id, "Include tax:", checked);
      const result = await onUpdateJob({ id: job.id, includeTax: checked });
      console.log("Tax setting saved successfully:", result);

      job.includeTax = checked;
      setIncludeTax(checked);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to update tax setting:", error);
      alert("Failed to update tax setting: " + (error.response?.data || error.message));
    } finally {
      setIsSavingTax(false);
    }
  };

  // Expose save function to parent components via ref
  useImperativeHandle(ref, () => ({
    saveAllPendingChanges: async () => {
      const promises = [];

      // Save material cost if there are unsaved changes
      if (hasUnsavedMaterialCost.current) {
        const costValue = parseFloat(customMaterialCost) || 0;
        if (costValue !== (job.customMaterialCost || 0)) {
          promises.push(
            onUpdateJob({ id: job.id, customMaterialCost: costValue })
              .then(() => {
                job.customMaterialCost = costValue;
                hasUnsavedMaterialCost.current = false;
              })
              .catch(error => {
                console.error("Failed to save material cost:", error);
              })
          );
        } else {
          hasUnsavedMaterialCost.current = false;
        }
      }

      // Save job price if there are unsaved changes
      if (hasUnsavedJobPrice.current) {
        const priceValue = parseFloat(jobPrice) || 0;
        if (priceValue !== (job.jobPrice || 0)) {
          promises.push(
            onUpdateJob({ id: job.id, jobPrice: priceValue })
              .then(() => {
                job.jobPrice = priceValue;
                hasUnsavedJobPrice.current = false;
              })
              .catch(error => {
                console.error("Failed to save job price:", error);
              })
          );
        } else {
          hasUnsavedJobPrice.current = false;
        }
      }

      // Wait for all saves to complete
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }
  }));

  // Financial data
  const internalMaterialCost = totalCost; // Calculated from actual materials (for display only)
  const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null ? job.customMaterialCost : 0; // Only use custom cost for billing, not internal
  const currentJobPrice = job.jobPrice || 0;
  const subtotal = billingMaterialCost + currentJobPrice; // Total cost only includes manual material cost + job price
  const taxAmount = includeTax ? subtotal * 0.06 : 0;
  const totalJobCost = subtotal + taxAmount;

  return (
    <div className="space-y-3">
      {/* First Row: Customer, Status, Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <h4 className="font-medium text-gray-600 mb-1 text-xs">Customer</h4>
          <p className="text-sm font-semibold break-words">{job.customerName || job.customer?.name || job.customer?.username || "Unknown Customer"}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <h4 className="font-medium text-gray-600 mb-1 text-xs">Status</h4>
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
                className="px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 transition-colors whitespace-nowrap"
              >
                Complete
              </button>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <h4 className="font-medium text-gray-600 mb-1 text-xs">Start Date</h4>
          <p className="text-sm font-semibold">{job.startDate ? new Date(job.startDate).toLocaleDateString() : "N/A"}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <h4 className="font-medium text-gray-600 mb-1 text-xs">End Date</h4>
          <p className="text-sm font-semibold">{job.endDate ? new Date(job.endDate).toLocaleDateString() : "Not completed"}</p>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Column - Costs */}
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <h4 className="font-medium text-gray-600 mb-1 text-xs">Internal Material Cost</h4>
            <p className="text-lg font-bold text-gray-900">${internalMaterialCost.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <h4 className="font-medium text-gray-600 mb-1 text-xs">Material Cost</h4>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customMaterialCost}
              onChange={(e) => {
                setCustomMaterialCost(e.target.value);
                hasUnsavedMaterialCost.current = true;
              }}
              onBlur={handleMaterialCostBlur}
              placeholder="0.00"
              disabled={isSavingMaterialCost}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Middle Column - Job Price & Tax */}
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <h4 className="font-medium text-gray-600 mb-1 text-xs">Job Price</h4>
            <input
              type="number"
              step="0.01"
              min="0"
              value={jobPrice}
              onChange={(e) => {
                setJobPrice(e.target.value);
                hasUnsavedJobPrice.current = true;
              }}
              onBlur={handleJobPriceBlur}
              placeholder="0.00"
              disabled={isSavingJobPrice}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold disabled:bg-gray-100"
            />
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <h4 className="font-medium text-gray-600 mb-1 text-xs">Tax (6%)</h4>
            <div className="flex items-center gap-2 mt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => handleToggleTax(e.target.checked)}
                  disabled={isSavingTax}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-semibold">
                {includeTax ? `$${taxAmount.toFixed(2)}` : "Not included"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Total with Breakdown */}
        <div className="bg-blue-50 p-2 rounded border-2 border-blue-500">
          <h4 className="font-semibold text-gray-700 mb-1.5 text-xs">Total Cost</h4>
          <p className="text-2xl font-bold text-gray-900 mb-2">${totalJobCost.toFixed(2)}</p>
          <div className="space-y-1 text-xs border-t border-blue-200 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Material:</span>
              <span className="font-semibold">${billingMaterialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Job Price:</span>
              <span className="font-semibold">${currentJobPrice.toFixed(2)}</span>
            </div>
            {includeTax && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (6%):</span>
                <span className="font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-blue-300">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="font-bold text-gray-900">${totalJobCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes Section - Always visible and editable */}
      <div className="bg-gray-50 p-2 rounded border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-600 text-xs">Notes</h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
            >
              {job.description ? "Edit" : "Add"}
            </button>
          )}
        </div>
        
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this job..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[80px]"
              rows="3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className={`px-2 py-1 rounded text-xs ${
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
                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
            {job.description || "No notes added yet"}
          </p>
        )}
      </div>
    </div>
  );
});

JobInfoSection.displayName = 'JobInfoSection';

export default JobInfoSection;
