import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as jobService from "../services/jobService";

export const useJobMutations = (selectedJobForDetails, setSelectedJobForDetails, searchTerm, page, pageSize, statusFilter) => {
  const queryClient = useQueryClient();

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
    onSuccess: async (sale, variables) => {
      try {
        // Optimistically update selected job details if open
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId && sale) {
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
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId) {
          try {
            // Refetch the specific job to get updated data
            const updatedJob = await jobService.getJob(variables.jobId);
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
        console.error("Failed to handle material addition success:", error);
      }
    },
  });

  // Remove material from job
  const removeMaterialFromJob = useMutation({
    mutationFn: async ({ jobId, materialId }) => {
      console.log("Mutation function called with:", { jobId, materialId });
      const result = await jobService.removeMaterialFromJob(jobId, materialId);
      console.log("Backend response:", result);
      return result;
    },
    onSuccess: async (_, variables) => {
      try {
        console.log("Material removal mutation succeeded with variables:", variables);
        
        // Since the backend successfully removed the material, update the local state
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId) {
          // Remove the sale that contains the material from the local state
          const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
          const updatedSales = currentSales.filter(sale => {
            if (sale.saleItems) {
              return !sale.saleItems.some(item => item.product.id === variables.materialId);
            }
            return true;
          });
          
          const updatedJob = { ...selectedJobForDetails, sales: updatedSales };
          setSelectedJobForDetails(updatedJob);
          
          console.log("Updated local state - Old sales count:", currentSales.length);
          console.log("Updated local state - New sales count:", updatedSales.length);
        }
        
        console.log("Material removed successfully");
      } catch (error) {
        console.error("Failed to handle material removal success:", error);
      }
    },
    onError: (error, variables) => {
      console.error("Material removal mutation failed:", error);
      console.error("Failed variables:", variables);
    }
  });

  return {
    addJob,
    updateJob,
    deleteJob,
    addMaterialToJob,
    removeMaterialFromJob,
  };
};
