package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.EmployeeDto;
import com.rewixxcloudapp.entity.Employee;
import com.rewixxcloudapp.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);

    @Autowired
    private EmployeeRepository employeeRepository;

    public List<Employee> getAllEmployees() {
        logger.info("Fetching all employees");
        return employeeRepository.findAll();
    }

    public List<Employee> getActiveEmployees() {
        logger.info("Fetching active employees only");
        return employeeRepository.findByActiveTrue();
    }

    public List<Employee> searchEmployees(String searchTerm) {
        logger.info("Searching employees with term: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllEmployees();
        }
        return employeeRepository.searchEmployees(searchTerm.trim());
    }

    public Optional<Employee> getEmployeeById(Long id) {
        logger.info("Fetching employee by ID: {}", id);
        return employeeRepository.findById(id);
    }

    public Employee createEmployee(EmployeeDto dto) {
        logger.info("Creating employee with name: {}", dto.getName());

        // Validate required fields
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Employee name is required");
        }

        Employee employee = new Employee();
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

    public Employee updateEmployee(Long id, EmployeeDto dto) {
        logger.info("Updating employee with ID: {}", id);

        Optional<Employee> employeeOpt = employeeRepository.findById(id);
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

    public void deleteEmployee(Long id) {
        logger.info("Deleting employee with ID: {}", id);

        if (!employeeRepository.existsById(id)) {
            throw new IllegalArgumentException("Employee not found with ID: " + id);
        }

        employeeRepository.deleteById(id);
        logger.info("Employee deleted successfully: {}", id);
    }

    public Employee toggleEmployeeStatus(Long id) {
        logger.info("Toggling active status for employee ID: {}", id);

        Optional<Employee> employeeOpt = employeeRepository.findById(id);
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
