import { useState } from "react";

export const useJobReceipts = (queryClient, jobs, selectedJobForDetails, setSelectedJobForDetails) => {
  const [processingReceiptJobId, setProcessingReceiptJobId] = useState(null);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);

  // Load receipts from localStorage for a specific job
  const loadLocalReceipts = (jobId) => {
    try {
      const stored = localStorage.getItem(`job_receipts_${jobId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading local receipts:", error);
      return [];
    }
  };

  // Save receipts to localStorage for a specific job
  const saveLocalReceipts = (jobId, receipts) => {
    try {
      localStorage.setItem(`job_receipts_${jobId}`, JSON.stringify(receipts));
    } catch (error) {
      console.error("Error saving local receipts:", error);
    }
  };

  // Handle receipt upload
  const handleReceiptUpload = async (file, jobId) => {
    try {
      setProcessingReceiptJobId(jobId);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const receiptInfo = {
            data: e.target.result,
            uploadedAt: new Date().toISOString(),
            name: file.name,
            size: file.size,
            type: file.type
          };

          // Save to localStorage
          const existingReceipts = loadLocalReceipts(jobId);
          const updatedReceipts = [...existingReceipts, receiptInfo];
          saveLocalReceipts(jobId, updatedReceipts);

          // Update local state and cache
          const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
          if (currentJob) {
            const updatedJob = {
              ...currentJob,
              receiptImageUrls: updatedReceipts.map(receipt => receipt.data)
            };
            
            setSelectedJobForDetails(updatedJob);
            
            // Update the jobs list cache
            try {
              const updatedJobs = jobs.map(job => job.id === jobId ? updatedJob : job);
              queryClient.setQueryData(["jobs", { searchTerm: "", page: 0, pageSize: 10, statusFilter: "All" }], {
                jobs: updatedJobs,
                totalJobs: updatedJobs.length,
                totalPages: 1,
                currentPage: 0,
                pageSize: 10,
                hasNext: false,
                hasPrevious: false
              });
            } catch (e) {
              console.warn("Failed to update jobs cache after receipt upload:", e);
            }
          }
        } catch (error) {
          console.error("Failed to process receipt:", error);
        } finally {
          setProcessingReceiptJobId(null);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to handle receipt upload:", error);
      setProcessingReceiptJobId(null);
    }
  };

  // Remove a specific receipt
  const removeReceipt = (jobId, receiptIndex) => {
    try {
      const existingReceipts = loadLocalReceipts(jobId);
      if (receiptIndex >= 0 && receiptIndex < existingReceipts.length) {
        const updatedReceipts = existingReceipts.filter((_, index) => index !== receiptIndex);
        saveLocalReceipts(jobId, updatedReceipts);
        
        // Update the current job object
        const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
        if (currentJob) {
          const updatedJob = {
            ...currentJob,
            receiptImageUrls: updatedReceipts.map(receipt => receipt.data)
          };
          
          setSelectedJobForDetails(updatedJob);
          
          // Update the jobs list cache
          try {
            const updatedJobs = jobs.map(job => job.id === jobId ? updatedJob : job);
            queryClient.setQueryData(["jobs", { searchTerm: "", page: 0, pageSize: 10, statusFilter: "All" }], {
              jobs: updatedJobs,
              totalJobs: updatedJobs.length,
              totalPages: 1,
              currentPage: 0,
              pageSize: 10,
              hasNext: false,
              hasPrevious: false
            });
          } catch (e) {
            console.warn("Failed to update jobs cache after receipt removal:", e);
          }
        }
      }
    } catch (error) {
      console.error("Failed to remove receipt:", error);
    }
  };

  // Clear all receipts for a job
  const clearAllReceipts = (jobId) => {
    try {
      // Clear from localStorage
      localStorage.removeItem(`job_receipts_${jobId}`);
      
      // Update the current job object
      const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
      if (currentJob) {
        const updatedJob = {
          ...currentJob,
          receiptImageUrls: []
        };
        
        setSelectedJobForDetails(updatedJob);
        
        // Update the jobs list cache
        try {
          const updatedJobs = jobs.map(job => job.id === jobId ? updatedJob : job);
          queryClient.setQueryData(["jobs", { searchTerm: "", page: 0, pageSize: 10, statusFilter: "All" }], {
            jobs: updatedJobs,
            totalJobs: updatedJobs.length,
            totalPages: 1,
            currentPage: 0,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false
          });
        } catch (e) {
          console.warn("Failed to update jobs cache after clearing receipts:", e);
        }
      }
    } catch (error) {
      console.error("Failed to clear receipts:", error);
    }
  };

  return {
    processingReceiptJobId,
    selectedJobForReceipt,
    setSelectedJobForReceipt,
    showReceiptModal,
    setShowReceiptModal,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    setCurrentReceiptData,
    handleReceiptUpload,
    removeReceipt,
    clearAllReceipts,
    loadLocalReceipts,
  };
};
