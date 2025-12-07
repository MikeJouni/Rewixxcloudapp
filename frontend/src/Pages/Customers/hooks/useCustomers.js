import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as customerService from "../services/customerService";
import { useState } from "react";

const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", { searchTerm, page, pageSize }],
    queryFn: () =>
      customerService.getCustomersList({ searchTerm, page, pageSize }),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  const customers = data?.customers || [];

  // Add customer
  const addCustomer = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Update customer
  const updateCustomer = useMutation({
    mutationFn: ({ id, ...customer }) =>
      customerService.updateCustomer(id, customer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  return {
    customers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages: data?.totalPages || 1,
    totalCustomers: data?.totalCustomers || 0,
    hasNext: data?.hasNext || false,
    hasPrevious: data?.hasPrevious || false,
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
