import { useState } from "react";
import config from "../../../config";

export const useJobReceipts = (queryClient, jobs, selectedJobForDetails, setSelectedJobForDetails) => {
  const [processingReceiptJobId, setProcessingReceiptJobId] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);
  

  // Handle receipt upload
  const handleReceiptUpload = async (file, jobId) => {
    setProcessingReceiptJobId(jobId);
    
    try {
      // Call the Python API to process the receipt directly
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Call the Python scanning API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`${config.PYTHON_API_BASE}/api/receipts/process`, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          },
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear timeout if request succeeds
        
        if (response.ok) {
          const receiptData = await response.json();
          
          // Show the receipt verification modal with the processed data
          setCurrentReceiptData(receiptData);
          setShowVerificationModal(true);
          
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        
      } catch (apiError) {
        // Check if it's a timeout error
        if (apiError.name === 'AbortError') {
          console.error("Receipt processing timed out after 15 seconds");
          setCurrentReceiptData({ 
            items: [], 
            vendor: 'Unknown', 
            processing_failed: true,
            error: 'Failed to process receipt. Took too long (>15 seconds). Please try again.'
          });
        } else {
          // Other API errors
          console.warn("Failed to call Python API, creating manual verification");
          setCurrentReceiptData({ 
            items: [], 
            vendor: 'Unknown', 
            processing_failed: true,
            error: 'Failed to process receipt. Please try again.'
          });
        }
        setShowVerificationModal(true);
      }
      
      // Reset the processing state after showing verification modal
      setProcessingReceiptJobId(null);
      
    } catch (error) {
      console.error("Failed to handle receipt upload:", error);
      setProcessingReceiptJobId(null);
    }
  };

  return {
    processingReceiptJobId,
    setProcessingReceiptJobId,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    setCurrentReceiptData,
    handleReceiptUpload,
    // Receipt storage functions removed - no longer storing receipts
    removeReceipt: () => {}, // No-op
    clearAllReceipts: () => {}, // No-op
    loadLocalReceipts: () => [], // No-op
  };
};