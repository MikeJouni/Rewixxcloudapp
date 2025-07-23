import Backend from "../../../Backend";

export const getCustomer = (id) =>
  Backend.get(`api/users/customers/${id}`);

export const createCustomer = (customer) =>
  Backend.post("api/users/customers", customer);

export const updateCustomer = (id, customer) =>
  Backend.put(`api/users/customers/${id}`, customer);

export const getCustomersList = (params = {}) =>
  Backend.post("api/users/customers/list", {
    page: params.page || 0,
    pageSize: params.pageSize || 10,
    searchTerm: params.searchTerm || ""
  }); 