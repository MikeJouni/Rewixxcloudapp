package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.service.CustomerService;
import com.rewixxcloudapp.dto.CustomerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private CustomerService customerService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        return null;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCustomer(@RequestBody CustomerDto dto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            if (dto.getUsername() == null || dto.getName() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username and name are required"));
            }
            Customer customer = customerService.createCustomer(dto, userId);
            return ResponseEntity.ok(customer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error creating customer: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            Optional<Customer> customer = customerService.getCustomerById(id, userId);
            return customer.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody CustomerDto dto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            Optional<Customer> customerOpt = customerService.getCustomerById(id, userId);
            if (customerOpt.isPresent()) {
                Customer updatedCustomer = customerService.updateCustomerFromDto(customerOpt.get(), dto);
                return ResponseEntity.ok(updatedCustomer);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error updating customer: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            Optional<Customer> customerOpt = customerService.getCustomerById(id, userId);
            if (customerOpt.isPresent()) {
                customerService.deleteCustomerById(id, userId);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getCustomersList(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            Integer pageSize = (Integer) requestBody.getOrDefault("pageSize", 10);
            Integer page = (Integer) requestBody.getOrDefault("page", 0);
            String searchTerm = (String) requestBody.getOrDefault("searchTerm", "");
            if (pageSize < 1 || pageSize > 10000) {
                pageSize = 10;
            }
            if (page < 0) {
                page = 0;
            }
            Map<String, Object> result = customerService.getCustomersList(page, pageSize, searchTerm, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}