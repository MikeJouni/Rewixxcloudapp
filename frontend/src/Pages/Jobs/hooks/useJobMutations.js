import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as jobService from "../services/jobService";

export const useJobMutations = (selectedJobForDetails, setSelectedJobForDetails, searchTerm, page, pageSize, statusFilter) => {
  const queryClient = useQueryClient();

  // Add job
  const addJob = useMutation({
    mutationFn: jobService.createJob,
    onSuccess: (data) => {
      try {
        // Invalidate all jobs queries to ensure the list refreshes
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        
        // Also try to refetch the current jobs query immediately
        queryClient.refetchQueries({ 
          queryKey: ["jobs", { searchTerm, page, pageSize, statusFilter }] 
        });
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
        // Invalidate jobs queries to refresh the data immediately
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        
        // Also refetch the current jobs query to ensure immediate update
        queryClient.refetchQueries({ 
          queryKey: ["jobs", { searchTerm, page, pageSize, statusFilter }] 
        });
        

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
      } catch (error) {
        console.error("Failed to handle material addition success:", error);
      }
    },
  });

  // Remove material from job
  const removeMaterialFromJob = useMutation({
    mutationFn: async ({ jobId, materialId }) => {
      const result = await jobService.removeMaterialFromJob(jobId, materialId);
      return result;
    },
    onSuccess: async (_, variables) => {
      try {

        
        // Update the local state immediately for optimistic UI update
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
          

        }
        
        // CRITICAL: Invalidate and refetch queries to ensure persistence
        try {
          // Invalidate all jobs queries to force refresh
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
          
          // Also refetch the specific job to ensure we have the latest data
          if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId) {
            const refetchedJob = await jobService.getJob(variables.jobId);
            if (refetchedJob) {
              setSelectedJobForDetails(refetchedJob);
            }
          }
          

        } catch (error) {
          console.error("Failed to invalidate queries or refetch job:", error);
        }
        

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
