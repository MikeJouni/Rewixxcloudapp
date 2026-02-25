import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as employeeService from "../services/employeeService";

const useEmployees = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["employees", searchTerm],
    queryFn: async () => {
      const response = await employeeService.getAllEmployees(searchTerm);
      // Handle both old format (array) and new format (object with employees property)
      return Array.isArray(response) ? response : (response?.employees || []);
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  // Fetch active employees only
  const { data: activeEmployees } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: () => employeeService.getActiveEmployees(),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  // Create employee mutation
  const addEmployee = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: async () => {
      // Invalidate all employee queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      // Refetch all employee queries to get the latest data
      await queryClient.refetchQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      console.error("Create employee mutation error:", error);
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: ({ id, data }) => employeeService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  // Delete employee mutation
  const deleteEmployee = useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => {
      console.error("Delete employee mutation error:", error);
    },
  });

  // Toggle employee status mutation
  const toggleStatus = useMutation({
    mutationFn: employeeService.toggleEmployeeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return {
    employees: Array.isArray(data) ? data : [],
    activeEmployees: Array.isArray(activeEmployees) ? activeEmployees : [],
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refetch,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleStatus,
  };
};

export default useEmployees;
