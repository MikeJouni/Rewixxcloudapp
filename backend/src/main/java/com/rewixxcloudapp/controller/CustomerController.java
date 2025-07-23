package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.User;
import com.rewixxcloudapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String name = request.get("name");

            if (username == null || password == null || name == null) {
                return ResponseEntity.badRequest().body("Username, password, and name are required");
            }

            Customer customer = userService.createCustomer(username, password, name);
            Optional<User> loadedCustomer = userService.getUserById(customer.getId());
            if (loadedCustomer.isPresent() && loadedCustomer.get() instanceof Customer) {
                return ResponseEntity.ok((Customer) loadedCustomer.get());
            } else {
                return ResponseEntity.ok(customer);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating customer: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        try {
            Optional<Customer> customer = userService.getCustomerById(id);
            return customer.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<Customer> customerOpt = userService.getCustomerById(id);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();

                // Update fields
                if (request.containsKey("username")) {
                    customer.setUsername((String) request.get("username"));
                }
                if (request.containsKey("name")) {
                    customer.setName((String) request.get("name"));
                }
                if (request.containsKey("phone")) {
                    customer.setPhone((String) request.get("phone"));
                }
                if (request.containsKey("addressLine1")) {
                    customer.setAddressLine1((String) request.get("addressLine1"));
                }
                if (request.containsKey("addressLine2")) {
                    customer.setAddressLine2((String) request.get("addressLine2"));
                }
                if (request.containsKey("city")) {
                    customer.setCity((String) request.get("city"));
                }
                if (request.containsKey("state")) {
                    customer.setState((String) request.get("state"));
                }
                if (request.containsKey("zip")) {
                    customer.setZip((String) request.get("zip"));
                }

                Customer updatedCustomer = userService.saveCustomer(customer);
                return ResponseEntity.ok(updatedCustomer);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/list")
    public ResponseEntity<String> getCustomersList(@RequestBody Map<String, Object> request) {
        try {
            // Extract pagination parameters with defaults
            Integer pageSize = (Integer) request.getOrDefault("pageSize", 10);
            Integer page = (Integer) request.getOrDefault("page", 0);
            String searchTerm = (String) request.getOrDefault("searchTerm", "");

            // Validate parameters
            if (pageSize < 1 || pageSize > 100) {
                pageSize = 10; // Default to 10 if invalid
            }
            if (page < 0) {
                page = 0; // Default to first page if invalid
            }

            // Get paginated customers from service
            Map<String, Object> result = userService.getCustomersList(page, pageSize, searchTerm);
            return ResponseEntity.ok(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving customers list: " + e.getMessage());
        }
    }
}