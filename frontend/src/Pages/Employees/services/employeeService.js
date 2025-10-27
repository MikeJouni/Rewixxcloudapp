import Backend from "../../../Backend";

export const getAllEmployees = (search = "") => {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return Backend.get(`api/employees${params}`);
};

export const getActiveEmployees = () => {
  return Backend.get("api/employees/active");
};

export const getEmployee = (id) => {
  return Backend.get(`api/employees/${id}`);
};

export const createEmployee = (employee) => {
  return Backend.post("api/employees", employee);
};

export const updateEmployee = (id, employee) => {
  return Backend.put(`api/employees/${id}`, employee);
};

export const deleteEmployee = (id) => {
  return Backend.delete(`api/employees/${id}`);
};

export const toggleEmployeeStatus = (id) => {
  return Backend.put(`api/employees/${id}/toggle`);
};
