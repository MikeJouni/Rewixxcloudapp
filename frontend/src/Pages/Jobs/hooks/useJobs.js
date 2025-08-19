import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import * as jobService from "../services/jobService";
import * as productService from "../services/productService";
import { useState } from "react";
import config from "../../../config";

const useJobs = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingJob, setEditingJob] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [processingReceiptJobId, setProcessingReceiptJobId] = useState(null);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedJobForMaterial, setSelectedJobForMaterial] = useState(null);

  // Local receipt persistence (frontend-only) - kept for fallback
  const loadLocalReceipts = (jobId) => {
    try {
      const raw = localStorage.getItem(`job_receipts_${jobId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Failed to load local receipts:", e);
      return [];
    }
  };

  const saveLocalReceipts = (jobId, receipts) => {
    try {
      localStorage.setItem(`job_receipts_${jobId}`, JSON.stringify(receipts));
    } catch (e) {
      console.warn("Failed to save local receipts:", e);
    }
  };

  const statusOptions = [
    "All",
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled",
  ];
  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  // Normalize status filter for API (enum style)
  const statusFilterParam = useMemo(() => {
    if (!statusFilter || statusFilter === "All") return "All";
    return statusFilter.toUpperCase().replace(/\s+/g, "_");
  }, [statusFilter]);

  // Fetch jobs from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", { searchTerm, page, pageSize, statusFilter }],
    queryFn: () =>
      jobService.getJobsList({ searchTerm, page, pageSize, statusFilter: statusFilterParam }),

  });

  // Fetch products for material form
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  const jobs = data?.jobs || [];
  // Ensure products is always an array and handle the API response structure
  const products = useMemo(() => {
    console.log("Raw products data:", productsData);
    if (!productsData) return [];
    // Handle different possible response structures
    if (Array.isArray(productsData)) return productsData;
    if (productsData.products && Array.isArray(productsData.products)) return productsData.products;
    if (productsData.content && Array.isArray(productsData.content)) return productsData.content;
    console.warn("Unexpected products data structure:", productsData);
    return [];
  }, [productsData]);

  // Debug jobs data
  useEffect(() => {
    console.log("Jobs data updated:", data);
    console.log("Jobs array:", jobs);
  }, [data, jobs]);

  // Reset to first page when filters or page size change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilterParam, pageSize]);

  // Mobile detection
  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(isMobileDevice);
  }, []);

  // Add job
  const addJob = useMutation({
    mutationFn: jobService.createJob,
    onSuccess: (data) => {
      console.log("Job created successfully in mutation:", data);
      console.log("Invalidating jobs query...");
      try {
        // Invalidate all jobs queries to ensure the list refreshes
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        
        // Also try to refetch the current jobs query immediately
        queryClient.refetchQueries({ 
          queryKey: ["jobs", { searchTerm, page, pageSize, statusFilter }] 
        });
        
        console.log("Jobs query invalidated and refetched successfully");
      } catch (error) {
        console.error("Failed to invalidate/refetch jobs query:", error);
      }
    },
    onError: (error) => {
      console.error("Error in addJob mutation:", error);
    }
  });

  // Update job
  const updateJob = useMutation({
    mutationFn: ({ id, ...job }) =>
      jobService.updateJob(id, job),
    onSuccess: () => {
      try {
        // Don't invalidate queries for receipt updates since we're using local storage
        // Only invalidate for other job updates if needed
      } catch (error) {
        console.error("Failed to handle job update success:", error);
      }
    },
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: (id) => jobService.deleteJob(id),
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      } catch (error) {
        console.error("Failed to invalidate jobs query:", error);
      }
    },
  });

  // Add material to job
  const addMaterialToJob = useMutation({
    mutationFn: ({ jobId, material }) =>
      jobService.addMaterialToJob(jobId, material),
    onSuccess: (sale, variables) => {
      try {
        // Optimistically update selected job details if open
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId && sale) {
          const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
          setSelectedJobForDetails({ ...selectedJobForDetails, sales: [...currentSales, sale] });
        }
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      } catch (error) {
        console.error("Failed to invalidate jobs query:", error);
      }
    },
  });

  const filteredJobs = useMemo(() => {
    // Merge local receipts with each job
    return jobs.map(job => {
      try {
        const localReceipts = loadLocalReceipts(job.id);
        const localImages = localReceipts.map(receipt => receipt.data);
        const backendImages = job.receiptImageUrls || [];
        
        // Combine and deduplicate
        const combinedImages = [...new Set([...backendImages, ...localImages])];
        
        return {
          ...job,
          receiptImageUrls: combinedImages
        };
      } catch (e) {
        return job;
      }
    });
  }, [jobs]);

  const startEditing = (job) => {
    setEditingJob(job);
  };

  const cancelEditing = () => {
    setEditingJob(null);
  };

  const handleJobUpdate = (updatedJob, materialData = null) => {
    // If material data is provided, handle it first
    if (materialData && materialData.source === "Barcode Scan") {
      // For barcode flow, avoid optimistic job overwrite that can temporarily hide materials
      handleBarcodeMaterial(updatedJob.id, materialData);
      return;
    }
    
    updateJob.mutate(updatedJob, {
      onSuccess: () => {
        // Update the local state to reflect the changes immediately
        setSelectedJobForDetails(updatedJob);
        // Also update the jobs list if this job is in it
        if (jobs.find(job => job.id === updatedJob.id)) {
          const updatedJobs = jobs.map(job => 
            job.id === updatedJob.id ? updatedJob : job
          );
          // Force a re-render by updating the query data
          try {
            queryClient.setQueryData(["jobs", { searchTerm, page, pageSize, statusFilter }], {
              ...data,
              jobs: updatedJobs
            });
          } catch (error) {
            console.error("Failed to update query data:", error);
            // Don't let this error break the flow
          }
        }
        // Invalidate and refetch to ensure we have the latest data including materials
        try {
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        } catch (error) {
          console.error("Failed to invalidate queries:", error);
          // Don't let this error break the flow
        }
      },
      onError: (error) => {
        console.error("Failed to update job:", error);
        // Don't let the job disappear on error
      }
    });
    setEditingJob(null);
  };

  const openMaterialForm = (job) => {
    setSelectedJobForMaterial(job);
    setShowMaterialForm(true);
  };

  const closeMaterialForm = () => {
    setShowMaterialForm(false);
    setSelectedJobForMaterial(null);
  };

  const handleBarcodeMaterial = async (jobId, materialData) => {
    try {
      // Create a product for the barcode scanned material
      const productData = {
        name: materialData.name,
        description: materialData.description || `Product from barcode scan: ${materialData.name}`,
        unitPrice: materialData.unitPrice || materialData.price || 0,
        category: materialData.category || "Barcode Scan",
        supplier: materialData.supplier || "Unknown"
      };

      console.log("Creating product from barcode scan:", productData);
      const createdProduct = await productService.createProduct(productData);
      console.log("Product created:", createdProduct);

      // Now add the material to the job using the created product
      const materialDto = {
        productId: createdProduct.id,
        quantity: materialData.quantity || 1,
        unitPrice: materialData.unitPrice || materialData.price || 0,
        notes: materialData.notes || `Scanned from barcode: ${materialData.sku || 'N/A'}`
      };

      console.log("Adding barcode material through backend API:", materialDto);
      // Create sale and optimistically append to details view
      const sale = await addMaterialToJob.mutateAsync({
        jobId: jobId,
        material: materialDto
      });
      console.log("Barcode material added through backend API successfully");
      if (selectedJobForDetails && selectedJobForDetails.id === jobId && sale) {
        const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
        setSelectedJobForDetails({ ...selectedJobForDetails, sales: [...currentSales, sale] });
      }

      // Refresh the jobs data to show the new material
      // Use a more targeted invalidation to prevent job disappearance
      try {
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      } catch (error) {
        console.error("Failed to invalidate queries:", error);
        // Don't let this error break the flow
      }
      
      // Update the selected job details if it's currently open
      if (selectedJobForDetails && selectedJobForDetails.id === jobId) {
        try {
          // Refetch the specific job to get updated data
          const updatedJob = await jobService.getJob(jobId);
          if (updatedJob) {
            setSelectedJobForDetails(updatedJob);
          }
        } catch (error) {
          console.error("Failed to refetch job:", error);
          // Don't let this error break the flow
        }
      }
      
      // Material added successfully (non-blocking)
      console.log("Material added successfully");
    } catch (error) {
      console.error("Failed to add barcode material:", error);
    }
  };

  const handleAddMaterial = (materialData) => {
    if (selectedJobForMaterial) {
      // Check if this is a barcode scanned material
      if (materialData.source === "Barcode Scan") {
        handleBarcodeMaterial(selectedJobForMaterial.id, materialData);
      } else {
        // Handle regular material addition and optimistically update
        addMaterialToJob.mutateAsync({
          jobId: selectedJobForMaterial.id,
          material: materialData,
        }).then((sale) => {
          if (selectedJobForDetails && selectedJobForDetails.id === selectedJobForMaterial.id && sale) {
            const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
            setSelectedJobForDetails({ ...selectedJobForDetails, sales: [...currentSales, sale] });
          }
        }).catch((err) => console.error("Failed to add material:", err));
      }
      closeMaterialForm();
    }
  };

  const processReceiptWithVeryfi = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${config.PYTHON_API_BASE}/api/receipts/process`,
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
      setProcessingReceiptJobId(jobId);

      try {
        // Process receipt with Veryfi
        const receiptData = await processReceiptWithVeryfi(file);

        // Read file for display
        const reader = new FileReader();
        reader.onload = async (e) => {
          // Create receipt object to store
          const receiptInfo = {
            id: Date.now(),
            name: file.name,
            data: e.target.result, // This is the base64 data URL
            uploadedAt: new Date().toISOString(),
            extractedData: receiptData,
          };

          // Store receipt locally in localStorage
          try {
            const existingLocal = loadLocalReceipts(jobId);
            const newLocal = [...existingLocal, receiptInfo];
            saveLocalReceipts(jobId, newLocal);

            // Store the receipt data for verification
            setCurrentReceiptData(receiptData);
            setCurrentJobId(jobId);
            setShowVerificationModal(true);

            // Update the current job object with the receipt images
            const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
            if (currentJob) {
              // Create updated job with receipt images from localStorage
              const updatedJob = {
                ...currentJob,
                receiptImageUrls: newLocal.map(receipt => receipt.data)
              };

              // Update local state
              setSelectedJobForDetails(updatedJob);
              
              // Update the jobs list cache
              try {
                const updatedJobs = jobs.map(job => job.id === jobId ? updatedJob : job);
                queryClient.setQueryData(["jobs", { searchTerm, page, pageSize, statusFilter }], {
                  ...data,
                  jobs: updatedJobs
                });
              } catch (e) {
                console.warn("Failed to update jobs cache with receipt:", e);
              }
            }
          } catch (error) {
            console.error("Failed to save receipt locally:", error);
          }
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to process receipt:", error);
      } finally {
        setProcessingReceiptJobId(null);
      }
    }
  };

  const handleReceiptVerification = async (verifiedData) => {
    console.log("Receipt verification data:", verifiedData);
    
    if (currentJobId && verifiedData.items && verifiedData.items.length > 0) {
      console.log("Adding items from receipt:", verifiedData.items);
      
      // Find the current job
      const currentJob = jobs.find(job => job.id === currentJobId);
      if (!currentJob) {
        console.error("Current job not found");
        return;
      }

      try {
        // Create products and add materials through the backend API for each item
        for (const item of verifiedData.items) {
          try {
            // First, create a product for this item
            const productData = {
              name: item.name,
              description: `Product from receipt: ${item.name}`,
              unitPrice: parseFloat(item.price) || 0,
              category: "Receipt Item",
              supplier: verifiedData.vendor || "Unknown"
            };

            console.log("Creating product:", productData);
            const createdProduct = await productService.createProduct(productData);
            console.log("Product created:", createdProduct);

            // Now add the material to the job using the created product
            const materialData = {
              productId: createdProduct.id,
              quantity: item.quantity || 1,
              unitPrice: parseFloat(item.price) || 0,
              notes: `From receipt: ${item.name}`
            };

            console.log("Adding material through backend API:", materialData);
            // Use the mutation function directly, not mutateAsync
            await addMaterialToJob.mutateAsync({
              jobId: currentJobId,
              material: materialData
            });
            console.log("Material added through backend API successfully");
          } catch (error) {
            console.error("Failed to process item:", item, error);
          }
        }

        // Refresh the jobs data to show the new materials
        // Use a more targeted invalidation to prevent job disappearance
        try {
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        } catch (error) {
          console.error("Failed to invalidate queries:", error);
          // Don't let this error break the flow
        }
        
        // Update the selected job details if it's currently open
        if (selectedJobForDetails && selectedJobForDetails.id === currentJobId) {
          try {
            // Refetch the specific job to get updated data
            const updatedJob = await jobService.getJob(currentJobId);
            if (updatedJob) {
              setSelectedJobForDetails(updatedJob);
            }
          } catch (error) {
            console.error("Failed to refetch job:", error);
            // Don't let this error break the flow
          }
        }
        
        console.log("Receipt materials added successfully");
      } catch (error) {
        console.error("Failed to process receipt materials:", error);
      }
    } else {
      console.log("No items found in receipt data or no current job ID");
      console.log("Current job ID:", currentJobId);
      console.log("Receipt data structure:", verifiedData);
    }

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
    // Merge local receipts when opening job details
    try {
      const localReceipts = loadLocalReceipts(job.id);
      const localImages = localReceipts.map(receipt => receipt.data);
      const backendImages = job.receiptImageUrls || [];
      
      // Combine and deduplicate
      const combinedImages = [...new Set([...backendImages, ...localImages])];
      
      const jobWithReceipts = {
        ...job,
        receiptImageUrls: combinedImages
      };
      
      setSelectedJobForDetails(jobWithReceipts);
    } catch (e) {
      setSelectedJobForDetails(job);
    }
    setShowJobDetailModal(true);
  };

  // Remove receipt from local storage
  const removeReceipt = (jobId, receiptIndex) => {
    try {
      if (receiptIndex === -1) {
        // Clear all receipts
        clearAllReceipts(jobId);
        return;
      }
      
      const existingLocal = loadLocalReceipts(jobId);
      const updatedLocal = existingLocal.filter((_, index) => index !== receiptIndex);
      saveLocalReceipts(jobId, updatedLocal);
      
      // Update the current job object
      const currentJob = jobs.find(job => job.id === jobId) || selectedJobForDetails;
      if (currentJob) {
        const updatedJob = {
          ...currentJob,
          receiptImageUrls: updatedLocal.map(receipt => receipt.data)
        };
        
        setSelectedJobForDetails(updatedJob);
        
        // Update the jobs list cache
        try {
          const updatedJobs = jobs.map(job => job.id === jobId ? updatedJob : job);
          queryClient.setQueryData(["jobs", { searchTerm, page, pageSize, statusFilter }], {
            ...data,
            jobs: updatedJobs
          });
        } catch (e) {
          console.warn("Failed to update jobs cache after receipt removal:", e);
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
          queryClient.setQueryData(["jobs", { searchTerm, page, pageSize, statusFilter }], {
            ...data,
            jobs: updatedJobs
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
    jobs,
    filteredJobs,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    statusOptions,
    priorityOptions,
    editingJob,
    isMobile,
    processingReceiptJobId,
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
    addMaterialToJob,
    startEditing,
    cancelEditing,
    handleJobUpdate,
    openMaterialForm,
    closeMaterialForm,
    handleAddMaterial,
    handleReceiptUpload,
    handleReceiptVerification,
    removeReceipt,
    clearAllReceipts,
    viewReceipts,
    viewJobDetails,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages: data?.totalPages || 1,
    totalJobs: data?.totalJobs || 0,
    hasNext: data?.hasNext || false,
    hasPrevious: data?.hasPrevious || false,
    showMaterialForm,
    selectedJobForMaterial,
    products,
  };
};

export default useJobs;