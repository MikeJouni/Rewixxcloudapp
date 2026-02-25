import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as expenseService from "../services/expenseService";

const useExpenses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState("All");
  const [jobIdFilter, setJobIdFilter] = useState(null);

  // Fetch expenses data
  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses", { searchTerm, page, pageSize, typeFilter, jobId: jobIdFilter }],
    queryFn: () => expenseService.getExpensesList({
      searchTerm,
      page,
      pageSize,
      typeFilter,
      jobId: jobIdFilter
    }),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  const expenses = data?.expenses || [];
  const totalExpenses = data?.totalExpenses || 0;
  const totalPages = data?.totalPages || 1;
  const hasNext = data?.hasNext || false;
  const hasPrevious = data?.hasPrevious || false;

  // Add expense mutation
  const addExpense = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error) => {
      console.error("Error in addExpense mutation:", error);
    }
  });

  // Update expense mutation
  const updateExpense = useMutation({
    mutationFn: ({ id, ...expense }) =>
      expenseService.updateExpense(id, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Delete expense mutation
  const deleteExpense = useMutation({
    mutationFn: (id) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Filtered expenses by search term and type
  const filteredExpenses = expenses;

  return {
    // Core data
    expenses: filteredExpenses,
    isLoading,
    error,
    totalExpenses,

    // Search and filters
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    jobIdFilter,
    setJobIdFilter,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,

    // Mutations
    addExpense,
    updateExpense,
    deleteExpense,
  };
};

export default useExpenses;
