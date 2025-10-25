import { useState, useMemo, useEffect } from "react";

export const useJobFilters = (jobs) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const statusOptions = ["All", "Pending", "In Progress", "Completed", "Cancelled"];

  // Filter jobs based on search term and status
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    return jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  // Reset to first page when filters or page size change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, pageSize]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    statusOptions,
    page,
    setPage,
    pageSize,
    setPageSize,
    filteredJobs,
  };
};
