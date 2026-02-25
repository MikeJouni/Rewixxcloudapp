import { useState, useEffect } from "react";
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
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  // Fetch products data
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Retry failed requests once
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
        // Skip invalidating queries to preserve job context
        console.log("Skipping query invalidation in handleJobUpdate to preserve job context");
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
      const currentJob = selectedJobForDetails;
      
      if (receiptData.items && receiptData.items.length > 0 && currentJob) {
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
                
                // Invalidate products query to refresh dropdown
                queryClient.invalidateQueries({ queryKey: ["products"] });
                
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
          
          // Simple refresh - just invalidate jobs queries
          queryClient.invalidateQueries({ 
            queryKey: ["jobs"], 
            exact: false 
          });
      }
      
      // Close the verification modal - simple!
      receipts.setShowVerificationModal(false);
      
      console.log("Receipt verification completed - modal closed");
      return { success: true };
      
    } catch (error) {
      console.error("Error adding materials:", error);
      // Still close the modal even if there's an error
      receipts.setShowVerificationModal(false);
      throw error;
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
    
    // Products
    products,
    productsLoading,
    productsError,
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