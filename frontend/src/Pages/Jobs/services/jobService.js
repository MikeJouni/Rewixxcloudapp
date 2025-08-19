import Backend from "../../../Backend";

export const getJob = (id) =>
  Backend.get(`api/jobs/${id}`);

export const createJob = (job) =>
  Backend.post("api/jobs/create", job);

export const updateJob = (id, job) =>
  Backend.put(`api/jobs/${id}`, job);

export const getJobsList = (params = {}) =>
  Backend.post("api/jobs/list", {
    page: params.page || 0,
    pageSize: params.pageSize || 10,
    searchTerm: params.searchTerm || "",
    statusFilter: params.statusFilter || "All",
  });

export const deleteJob = (id) =>
  Backend.delete(`api/jobs/${id}`);

export const addMaterialToJob = (jobId, material) =>
  Backend.post(`api/jobs/${jobId}/materials`, material);
