import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as customerService from "../services/customerService";
import { useState, useMemo } from "react";

const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { data, isLoading, error } = useQuery(
    ["customers", { searchTerm }],
    () => customerService.getCustomersList({ searchTerm }),
    { keepPreviousData: true }
  );

  const customers = data?.data || data || [];

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // Add customer
  const addCustomer = useMutation(customerService.createCustomer, {
    onSuccess: () => queryClient.invalidateQueries(["customers"]),
  });

  // Update customer
  const updateCustomer = useMutation(
    ({ id, ...customer }) => customerService.updateCustomer(id, customer),
    {
      onSuccess: () => queryClient.invalidateQueries(["customers"]),
    }
  );

  // Delete customer 
  const deleteCustomer = useMutation(
    (id) => customerService.deleteCustomer(id),
    {
      onSuccess: () => queryClient.invalidateQueries(["customers"]),
    }
  );

  const getCustomerDetails = (id) =>
    useQuery(["customer", id], () => customerService.getCustomer(id), {
      enabled: !!id,
    });

  const startEditing = (customer) => setEditingCustomer(customer);
  const cancelEditing = () => setEditingCustomer(null);

  return {
    customers: filteredCustomers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    editingCustomer,
    startEditing,
    cancelEditing,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerDetails,
  };
};

export default useCustomers;

