import Backend from "../../../Backend";

export const getExpense = (id) =>
  Backend.get(`api/expenses/${id}`);

export const createExpense = (expense) =>
  Backend.post("api/expenses/create", expense);

export const updateExpense = (id, expense) =>
  Backend.put(`api/expenses/${id}`, expense);

export const getExpensesList = (params = {}) =>
  Backend.post("api/expenses/list", {
    page: params.page || 0,
    pageSize: params.pageSize || 10,
    searchTerm: params.searchTerm || "",
    typeFilter: params.typeFilter || "All",
    jobId: params.jobId || null,
  });

export const deleteExpense = (id) =>
  Backend.delete(`api/expenses/${id}`);

export const getExpensesByJob = (jobId) =>
  Backend.get(`api/expenses/job/${jobId}`);
