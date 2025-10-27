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

        // Update the jobs cache in place to avoid losing context
        try {
          const currentJobsData = queryClient.getQueryData(["jobs", { searchTerm: searchTerm, page, pageSize, statusFilter }]);
          if (currentJobsData && currentJobsData.jobs) {
            const updatedJobs = currentJobsData.jobs.map(job => {
              if (job.id === variables.jobId) {
                // Update the specific job with new sales
                const currentSales = Array.isArray(job.sales) ? job.sales : [];
                return { ...job, sales: [...currentSales, sale] };
              }
              return job;
            });
            
            queryClient.setQueryData(
              ["jobs", { searchTerm: searchTerm, page, pageSize, statusFilter }], 
              { ...currentJobsData, jobs: updatedJobs }
            );
          }
        } catch (error) {
          console.error("Failed to update jobs cache:", error);
          // Skip invalidation to preserve job context
          console.log("Skipping query invalidation to preserve job context");
        }
        
        // Do not refetch the job here; rely on optimistic updates above to keep UI stable
        
        // Material added successfully (non-blocking)
      } catch (error) {
        console.error("Failed to handle material addition success:", error);
      }
    },
  });

  // Remove material from job
  const removeMaterialFromJob = useMutation({
    mutationFn: async ({ jobId, materialId }) => {
      // materialId is actually the saleId now
      const result = await jobService.removeMaterialFromJob(jobId, materialId);
      return result;
    },
    onSuccess: async (_, variables) => {
      try {
        // Update the local state immediately for optimistic UI update
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId) {
          // Remove the sale by saleId (passed as materialId)
          const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
          const updatedSales = currentSales.filter(sale => sale.id !== variables.materialId);

          const updatedJob = { ...selectedJobForDetails, sales: updatedSales };
          setSelectedJobForDetails(updatedJob);
          console.log("Material removed, updated sales count:", updatedSales.length);
        }

        // Do not invalidate the whole jobs list to avoid losing context
        // Selected job is already refreshed above when applicable

      } catch (error) {
        console.error("Failed to handle material removal success:", error);
      }
    },
    onError: (error, variables) => {
      console.error("Material removal mutation failed:", error);
      console.error("Failed variables:", variables);
    }
  });

  // Update material in job (quantity/price)
  const updateMaterialInJob = useMutation({
    mutationFn: async ({ jobId, saleId, quantity }) => {
      const result = await jobService.updateMaterialInJob(jobId, saleId, { quantity });
      return result;
    },
    onSuccess: async (updatedSale, variables) => {
      try {
        // Update the local state immediately for optimistic UI update
        if (selectedJobForDetails && selectedJobForDetails.id === variables.jobId && updatedSale) {
          const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
          const updatedSales = currentSales.map(sale =>
            sale.id === variables.saleId ? updatedSale : sale
          );

          const updatedJob = { ...selectedJobForDetails, sales: updatedSales };
          setSelectedJobForDetails(updatedJob);
          console.log("Material updated successfully");
        }

        // Do not invalidate the whole jobs list to avoid losing context

      } catch (error) {
        console.error("Failed to handle material update success:", error);
      }
    },
    onError: (error, variables) => {
      console.error("Material update mutation failed:", error);
      console.error("Failed variables:", variables);
    }
  });

  return {
    addJob,
    updateJob,
    deleteJob,
    addMaterialToJob,
    removeMaterialFromJob,
    updateMaterialInJob,
  };
};
