package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @PostMapping("/create")
    public ResponseEntity<Customer> createCustomer(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String name = request.get("name");

            if (username == null || password == null || name == null) {
                return ResponseEntity.badRequest().build();
            }

            Customer customer = customerService.createCustomer(username, password, name);
            Optional<Customer> loadedCustomer = customerService.getCustomerById(customer.getId());
            return loadedCustomer.map(ResponseEntity::ok)
                                 .orElseGet(() -> ResponseEntity.ok(customer));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/get")
    public ResponseEntity<Customer> getCustomerById(@RequestBody Map<String, Object> request) {
        try {
            Long id = request.get("id") instanceof Integer ? ((Integer) request.get("id")).longValue() : (Long) request.get("id");
            Optional<Customer> customer = customerService.getCustomerById(id);
            return customer.map(ResponseEntity::ok)
                           .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update")
    public ResponseEntity<Customer> updateCustomer(@RequestBody Map<String, Object> request) {
        try {
            Long id = request.get("id") instanceof Integer ? ((Integer) request.get("id")).longValue() : (Long) request.get("id");
            Optional<Customer> customerOpt = customerService.getCustomerById(id);
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

                Customer updatedCustomer = customerService.saveCustomer(customer);
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

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCustomer(@RequestBody Map<String, Object> request) {
        try {
            Long id = request.get("id") instanceof Integer ? ((Integer) request.get("id")).longValue() : (Long) request.get("id");
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
            if (pageSize < 1 || pageSize > 100) {
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