import Backend from "../../../Backend";

export const getPaymentsByJobId = (jobId) => {
  return Backend.get(`api/payments/job/${jobId}`);
};

export const getTotalPaidByJobId = (jobId) => {
  return Backend.get(`api/payments/job/${jobId}/total`);
};

export const createPayment = (payment) => {
  return Backend.post("api/payments", payment);
};

export const deletePayment = (id) => {
  return Backend.delete(`api/payments/${id}`);
};
