import { useState, useEffect } from "react";
import config from "../../../config";

export const useJobReceipts = (queryClient, jobs, selectedJobForDetails, setSelectedJobForDetails) => {
  const [processingReceiptJobId, setProcessingReceiptJobId] = useState(null);
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
    setProcessingReceiptJobId(jobId);
    
    try {
      // First, save the file to localStorage temporarily
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
          
          // Update the job object with the new receipt URLs so it shows in the UI
          const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
          if (currentJob) {
            const updatedJob = {
              ...currentJob,
              receiptImageUrls: updatedReceipts.map(receipt => receipt.data)
            };
            setSelectedJobForDetails(updatedJob);
          }
          
          // Now call the Python API to process the receipt
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            // Call the Python scanning API
            const response = await fetch(`${config.PYTHON_API_BASE}/api/receipts/process`, {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const receiptData = await response.json();
              
              // Show the receipt verification modal with the processed data
              setCurrentReceiptData(receiptData);
              setShowVerificationModal(true);
              
            } else {
              throw new Error(`API error: ${response.status}`);
            }
            
          } catch (apiError) {
            // If API fails, just save the receipt locally
            console.warn("Failed to call Python API, saving locally only");
          }
          
          // Reset the processing state after completion
          setProcessingReceiptJobId(null);
          
        } catch (error) {
          console.error("Failed to process receipt:", error);
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
