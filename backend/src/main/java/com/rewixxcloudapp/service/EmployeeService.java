package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.EmployeeDto;
import com.rewixxcloudapp.entity.Employee;
import com.rewixxcloudapp.repository.EmployeeRepository;
import com.rewixxcloudapp.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    public List<Employee> getAllEmployees(Long userId) {
        logger.info("Fetching all employees for user {}", userId);
        return employeeRepository.findByUserId(userId);
    }

    public List<Employee> getActiveEmployees(Long userId) {
        logger.info("Fetching active employees only for user {}", userId);
        return employeeRepository.findByActiveTrueAndUserId(userId);
    }

    public List<Employee> searchEmployees(String searchTerm, Long userId) {
        logger.info("Searching employees with term: {} for user {}", searchTerm, userId);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllEmployees(userId);
        }
        return employeeRepository.searchEmployees(searchTerm.trim(), userId);
    }

    public Optional<Employee> getEmployeeById(Long id, Long userId) {
        logger.info("Fetching employee by ID: {} for user {}", id, userId);
        return employeeRepository.findByIdAndUserId(id, userId);
    }

    public Employee createEmployee(EmployeeDto dto, Long userId) {
        logger.info("Creating employee with name: {}", dto.getName());

        // Validate required fields
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Employee name is required");
        }

        Employee employee = new Employee();
        employee.setUserId(userId);
        employee.setName(dto.getName().trim());
        employee.setPhone(dto.getPhone());
        employee.setEmail(dto.getEmail());
        employee.setAddress(dto.getAddress());
        employee.setNotes(dto.getNotes());
        employee.setActive(dto.getActive() != null ? dto.getActive() : true);

        Employee savedEmployee = employeeRepository.save(employee);
        logger.info("Employee created successfully with ID: {}", savedEmployee.getId());
        return savedEmployee;
    }

    public Employee updateEmployee(Long id, EmployeeDto dto, Long userId) {
        logger.info("Updating employee with ID: {} for user {}", id, userId);

        Optional<Employee> employeeOpt = employeeRepository.findByIdAndUserId(id, userId);
        if (!employeeOpt.isPresent()) {
            throw new IllegalArgumentException("Employee not found with ID: " + id);
        }

        Employee employee = employeeOpt.get();

        // Update fields if provided
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            employee.setName(dto.getName().trim());
        }
        if (dto.getPhone() != null) {
            employee.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) {
            employee.setEmail(dto.getEmail());
        }
        if (dto.getAddress() != null) {
            employee.setAddress(dto.getAddress());
        }
        if (dto.getNotes() != null) {
            employee.setNotes(dto.getNotes());
        }
        if (dto.getActive() != null) {
            employee.setActive(dto.getActive());
        }

        Employee updatedEmployee = employeeRepository.save(employee);
        logger.info("Employee updated successfully: {}", updatedEmployee.getId());
        return updatedEmployee;
    }

    @Transactional
    public void deleteEmployee(Long id, Long userId) {
        logger.info("Deleting employee with ID: {} for user {}", id, userId);

        // Fetch employee to get name used in labor expenses
        Employee employee = employeeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + id));

        // First delete all expenses associated with this employee (labor expenses reference employeeName)
        try {
            String employeeName = employee.getName();
            if (employeeName != null && !employeeName.trim().isEmpty()) {
                logger.info("Deleting expenses associated with employee '{}' for user {}", employeeName, userId);
                expenseRepository.deleteByEmployeeNameAndUserId(employeeName.trim(), userId);
            }
        } catch (Exception e) {
            logger.error("Error deleting expenses for employee ID {}: {}", id, e.getMessage(), e);
            throw new IllegalStateException("Failed to delete expenses for employee: " + e.getMessage(), e);
        }

        // Now delete the employee itself
        employeeRepository.deleteById(id);
        logger.info("Employee deleted successfully: {}", id);
    }

    public Employee toggleEmployeeStatus(Long id, Long userId) {
        logger.info("Toggling active status for employee ID: {} for user {}", id, userId);

        Optional<Employee> employeeOpt = employeeRepository.findByIdAndUserId(id, userId);
        if (!employeeOpt.isPresent()) {
            throw new IllegalArgumentException("Employee not found with ID: " + id);
        }

        Employee employee = employeeOpt.get();
        employee.setActive(!employee.getActive());

        Employee updatedEmployee = employeeRepository.save(employee);
        logger.info("Employee status toggled to: {}", updatedEmployee.getActive());
        return updatedEmployee;
    }
}
