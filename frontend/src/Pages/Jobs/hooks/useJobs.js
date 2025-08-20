import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as jobService from "../services/jobService";
import * as productService from "../services/productService";
import { useJobMutations } from "./useJobMutations";
import { useJobFilters } from "./useJobFilters";
import { useJobReceipts } from "./useJobReceipts";
import { useJobMaterials } from "./useJobMaterials";

const useJobs = () => {
  const queryClient = useQueryClient();
  
  // Core state
  const [editingJob, setEditingJob] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);

  // Fetch jobs data
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", { searchTerm: "", page: 0, pageSize: 10, statusFilter: "All" }],
    queryFn: () => jobService.getJobsList({ searchTerm: "", page: 0, pageSize: 10, statusFilter: "All" }),
  });

  const jobs = data?.jobs || [];

  // Use separated hooks
  const filters = useJobFilters(jobs);
  const mutations = useJobMutations(selectedJobForDetails, setSelectedJobForDetails, filters.searchTerm, filters.page, filters.pageSize, filters.statusFilter);
  const receipts = useJobReceipts(queryClient, jobs, selectedJobForDetails, setSelectedJobForDetails);
  const materials = useJobMaterials();
  


  // Mobile detection
  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    setIsMobile(isMobileDevice);
  }, []);
  


  // Job editing functions
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
      materials.handleBarcodeMaterial(updatedJob.id, materialData, mutations.addMaterialToJob, selectedJobForDetails, setSelectedJobForDetails, queryClient, filters.searchTerm, filters.page, filters.pageSize, filters.statusFilter);
      return;
    }
    
    mutations.updateJob.mutate(updatedJob, {
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
            queryClient.setQueryData(["jobs", { searchTerm: filters.searchTerm, page: filters.page, pageSize: filters.pageSize, statusFilter: filters.statusFilter }], {
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

  // View job details
  const viewJobDetails = (job) => {
    setSelectedJobForDetails(job);
    setShowJobDetailModal(true);
  };

  // Receipt verification
  const handleReceiptVerification = async (receiptData) => {
    try {
      // Add materials from the receipt to the job
      if (receiptData.items && receiptData.items.length > 0) {
        const currentJob = selectedJobForDetails;
        
        if (currentJob) {
          // Convert receipt items to materials and add them to the job
          for (const item of receiptData.items) {
            if (item.name && item.price) {
              try {
                // First, create a product for this receipt item
                const productData = {
                  name: item.name,
                  description: `Product from receipt: ${item.name}`,
                  unitPrice: item.price,
                  category: "Receipt Item",
                  supplier: receiptData.vendor || "Receipt"
                };
                
                const createdProduct = await productService.createProduct(productData);
                
                // Now add the material to the job using the created product
                const materialDto = {
                  productId: createdProduct.id,
                  quantity: item.quantity || 1,
                  unitPrice: item.price,
                  notes: `From receipt: ${receiptData.receipt_number || 'Unknown'}`
                };
                
                await mutations.addMaterialToJob.mutateAsync({
                  jobId: currentJob.id,
                  material: materialDto
                });
                
              } catch (itemError) {
                console.error(`Failed to process item ${item.name}:`, itemError);
              }
            }
          }
          
          // Refresh the job data to show the new materials
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }
      }
      
      // Close the verification modal
      receipts.setShowVerificationModal(false);
      
    } catch (error) {
      console.error("Error adding materials:", error);
      // Still close the modal even if there's an error
      receipts.setShowVerificationModal(false);
    }
  };



  return {
    // Core data
    jobs,
    filteredJobs: filters.filteredJobs,
    isLoading,
    error,
    
    // Filters
    ...filters,
    
    // Mutations
    ...mutations,
    
    // Receipts
    ...receipts,
    
    // Materials
    ...materials,
    
    // Job editing
    editingJob,
    startEditing,
    cancelEditing,
    handleJobUpdate,
    
    // Job details
    selectedJobForDetails,
    setSelectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    viewJobDetails,
    
    // Receipt verification
    handleReceiptVerification,
    
    // Pagination
    totalPages: data?.totalPages || 1,
    totalJobs: data?.totalJobs || 0,
    hasNext: data?.hasNext || false,
    hasPrevious: data?.hasPrevious || false,
    
    // Mobile
    isMobile,
  };
};

export default useJobs;