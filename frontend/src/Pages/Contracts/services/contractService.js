import Backend from "../../../Backend";

export const createContract = (contractData) => {
  return Backend.post("api/contracts/create", contractData);
};

export const getContractsList = (params = {}) => {
  return Backend.post("api/contracts/list", {
    page: params.page || 0,
    pageSize: params.pageSize || 10,
    searchTerm: params.searchTerm || "",
  });
};

export const getContractById = (id) => {
  return Backend.get(`api/contracts/${id}`);
};

export const updateContract = (id, contractData) => {
  return Backend.put(`api/contracts/${id}`, contractData);
};

export const deleteContract = (id) => {
  return Backend.delete(`api/contracts/${id}`);
};

export const getContractByJobId = (jobId) => {
  return Backend.get(`api/contracts/by-job/${jobId}`);
};
