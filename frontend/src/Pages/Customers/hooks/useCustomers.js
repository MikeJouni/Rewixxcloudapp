import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as customerService from "../services/customerService";
import { useState, useMemo } from "react";

const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Fetch all customers (paginated, can be adjusted)
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", { searchTerm }],
    queryFn: () => customerService.getCustomersList({ searchTerm }),
    keepPreviousData: true
  });

  const customers = data?.customers || [];

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
  const addCustomer = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Update customer
  const updateCustomer = useMutation({
    mutationFn: ({ id, ...customer }) => customerService.updateCustomer(id, customer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
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
  };
};

export default useCustomers;

// Custom hook for fetching a single customer by id
export const useCustomerDetails = (id) =>
  useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
  });

