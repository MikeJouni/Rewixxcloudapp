import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as employeeService from "../services/employeeService";

const useEmployees = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["employees", searchTerm],
    queryFn: () => employeeService.getAllEmployees(searchTerm),
  });

  // Fetch active employees only
  const { data: activeEmployees } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: () => employeeService.getActiveEmployees(),
  });

  // Create employee mutation
  const addEmployee = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
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
  });

  // Toggle employee status mutation
  const toggleStatus = useMutation({
    mutationFn: employeeService.toggleEmployeeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return {
    employees: data || [],
    activeEmployees: activeEmployees || [],
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
