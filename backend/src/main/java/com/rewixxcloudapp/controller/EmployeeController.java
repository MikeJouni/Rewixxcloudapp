package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.dto.EmployeeDto;
import com.rewixxcloudapp.entity.Employee;
import com.rewixxcloudapp.service.EmployeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeController.class);

    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees(@RequestParam(required = false) String search) {
        logger.info("GET /api/employees - search: {}", search);
        try {
            List<Employee> employees;
            if (search != null && !search.trim().isEmpty()) {
                employees = employeeService.searchEmployees(search);
            } else {
                employees = employeeService.getAllEmployees();
            }
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            logger.error("Error fetching employees", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<Employee>> getActiveEmployees() {
        logger.info("GET /api/employees/active");
        try {
            List<Employee> employees = employeeService.getActiveEmployees();
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            logger.error("Error fetching active employees", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEmployeeById(@PathVariable Long id) {
        logger.info("GET /api/employees/{}", id);
        try {
            Optional<Employee> employee = employeeService.getEmployeeById(id);
            if (employee.isPresent()) {
                return ResponseEntity.ok(employee.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Employee not found with ID: " + id));
            }
        } catch (Exception e) {
            logger.error("Error fetching employee by ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching employee: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeDto employeeDto) {
        logger.info("POST /api/employees - name: {}", employeeDto.getName());
        try {
            Employee employee = employeeService.createEmployee(employeeDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(employee);
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error creating employee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating employee", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error creating employee: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody EmployeeDto employeeDto) {
        logger.info("PUT /api/employees/{}", id);
        try {
            Employee employee = employeeService.updateEmployee(id, employeeDto);
            return ResponseEntity.ok(employee);
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error updating employee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating employee ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error updating employee: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        logger.info("DELETE /api/employees/{}", id);
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.ok(createSuccessResponse("Employee deleted successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Error deleting employee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting employee ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error deleting employee: " + e.getMessage()));
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getEmployeesList(@RequestBody Map<String, Object> request) {
        logger.info("POST /api/employees/list");
        try {
            String searchTerm = (String) request.getOrDefault("searchTerm", "");
            List<Employee> employees;
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                employees = employeeService.searchEmployees(searchTerm.trim());
            } else {
                employees = employeeService.getAllEmployees();
            }
            Map<String, Object> result = new HashMap<>();
            result.put("employees", employees);
            result.put("totalEmployees", employees.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error fetching employees list", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching employees: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleEmployeeStatus(@PathVariable Long id) {
        logger.info("PUT /api/employees/{}/toggle", id);
        try {
            Employee employee = employeeService.toggleEmployeeStatus(id);
            return ResponseEntity.ok(employee);
        } catch (IllegalArgumentException e) {
            logger.warn("Error toggling employee status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error toggling employee status ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error toggling employee status: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return response;
    }

    private Map<String, String> createSuccessResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}
