package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.service.CustomerService;
import com.rewixxcloudapp.dto.CustomerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private CustomerService customerService;

    @PostMapping("/create")
    public ResponseEntity<?> createCustomer(@RequestBody CustomerDto dto) {
        try {
            if (dto.getUsername() == null || dto.getName() == null) {
                return ResponseEntity.badRequest().body("Username and name are required");
            }
            Customer customer = customerService.createCustomer(dto);
            return ResponseEntity.ok(customer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating customer: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        try {
            Optional<Customer> customer = customerService.getCustomerById(id);
            return customer.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody CustomerDto dto) {
        try {
            Optional<Customer> customerOpt = customerService.getCustomerById(id);
            if (customerOpt.isPresent()) {
                Customer updatedCustomer = customerService.updateCustomerFromDto(customerOpt.get(), dto);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        try {
            Optional<Customer> customerOpt = customerService.getCustomerById(id);
            if (customerOpt.isPresent()) {
                customerService.deleteCustomerById(id);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getCustomersList(@RequestBody Map<String, Object> request) {
        try {
            Integer pageSize = (Integer) request.getOrDefault("pageSize", 10);
            Integer page = (Integer) request.getOrDefault("page", 0);
            String searchTerm = (String) request.getOrDefault("searchTerm", "");
            if (pageSize < 1 || pageSize > 10000) {
                pageSize = 10;
            }
            if (page < 0) {
                page = 0;
            }
            Map<String, Object> result = customerService.getCustomersList(page, pageSize, searchTerm);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}