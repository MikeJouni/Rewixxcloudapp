import { useState, useMemo, useEffect } from "react";
import config from "../../../config";

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingJob, setEditingJob] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);

  const statusOptions = [
    "All",
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled",
  ];
  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(isMobileDevice);
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const addJob = (jobData) => {
    const newJob = {
      id: jobs.length + 1,
      ...jobData,
      actualHours: 0,
      receipts: [],
      materials: [],
      totalCost: 0,
    };
    setJobs([...jobs, newJob]);
  };

  const updateJob = (jobData) => {
    setJobs(jobs.map((job) => (job.id === jobData.id ? jobData : job)));
    setEditingJob(null);
  };

  const deleteJob = (jobId) => {
    setJobs(jobs.filter((job) => job.id !== jobId));
  };

  const startEditing = (job) => {
    setEditingJob(job);
  };

  const cancelEditing = () => {
    setEditingJob(null);
  };

  const processReceiptWithVeryfi = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${config.API_BASE_URL}/api/receipts/process`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const receiptData = await response.json();
      return receiptData;
    } catch (error) {
      console.error("Error processing receipt with Veryfi:", error);
      throw error;
    }
  };

  const handleReceiptUpload = async (jobId, event) => {
    const file = event.target.files[0];
    if (file) {
      setProcessingReceipt(true);

      try {
        // Process receipt with Veryfi
        const receiptData = await processReceiptWithVeryfi(file);

        // Read file for display
        const reader = new FileReader();
        reader.onload = (e) => {
          const receiptInfo = {
            id: Date.now(),
            name: file.name,
            data: e.target.result,
            uploadedAt: new Date().toISOString(),
            extractedData: receiptData,
          };

          // Store the receipt data for verification
          setCurrentReceiptData(receiptData);
          setCurrentJobId(jobId);
          setShowVerificationModal(true);

          // Add receipt to job (without materials yet)
          setJobs(
            jobs.map((job) => {
              if (job.id === jobId) {
                return {
                  ...job,
                  receipts: [...(job.receipts || []), receiptInfo],
                };
              }
              return job;
            })
          );
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to process receipt:", error);
        alert(
          "Failed to process receipt. Please try again or contact support."
        );
      } finally {
        setProcessingReceipt(false);
      }
    }
  };

  const handleReceiptVerification = (verifiedData) => {
    // Add verified items as materials to the job
    setJobs(
      jobs.map((job) => {
        if (job.id === currentJobId) {
          // Convert verified items to materials format
          const newMaterials = verifiedData.items.map((item) => ({
            id: Date.now() + Math.random(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            supplier: currentReceiptData.vendor,
            category: "Receipt Item",
            source: "Receipt Scan (Verified)",
            notes: verifiedData.notes,
          }));

          const updatedMaterials = [...(job.materials || []), ...newMaterials];

          // Update total cost
          const newTotalCost = (job.totalCost || 0) + verifiedData.total;

          return {
            ...job,
            materials: updatedMaterials,
            totalCost: newTotalCost,
          };
        }
        return job;
      })
    );

    // Reset verification state
    setCurrentReceiptData(null);
    setCurrentJobId(null);
    setShowVerificationModal(false);
  };

  const viewReceipts = (job) => {
    setSelectedJobForReceipt(job);
    setShowReceiptModal(true);
  };

  const viewJobDetails = (job) => {
    setSelectedJobForDetails(job);
    setShowJobDetailModal(true);
  };

  const handleJobUpdate = (updatedJob) => {
    setJobs(jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    // Also update the selected job for details if it's the same job
    if (selectedJobForDetails && selectedJobForDetails.id === updatedJob.id) {
      setSelectedJobForDetails(updatedJob);
    }
  };

  return {
    jobs,
    filteredJobs,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    statusOptions,
    priorityOptions,
    editingJob,
    isMobile,
    processingReceipt,
    selectedJobForReceipt,
    showReceiptModal,
    setShowReceiptModal,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    selectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    addJob,
    updateJob,
    deleteJob,
    startEditing,
    cancelEditing,
    handleReceiptUpload,
    handleReceiptVerification,
    viewReceipts,
    viewJobDetails,
    handleJobUpdate,
  };
};

export default useJobs;
