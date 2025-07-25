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
            String email = request.get("username");
            String name = request.get("name");
            String phone = request.get("phone");
            String addressLine1 = request.get("addressLine1");
            String addressLine2 = request.get("addressLine2");
            String city = request.get("city");
            String state = request.get("state");
            String zip = request.get("zip");

            if (email == null || name == null) {
                return ResponseEntity.badRequest().build();
            }

            Customer customer = new Customer();
            customer.setUsername(email);
            customer.setName(name);
            customer.setPhone(phone);
            customer.setAddressLine1(addressLine1);
            customer.setAddressLine2(addressLine2);
            customer.setCity(city);
            customer.setState(state);
            customer.setZip(zip);

            Customer savedCustomer = customerService.saveCustomer(customer);
            Optional<Customer> loadedCustomer = customerService.getCustomerById(savedCustomer.getId());
            return loadedCustomer.map(ResponseEntity::ok)
                                 .orElseGet(() -> ResponseEntity.ok(savedCustomer));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
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
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<Customer> customerOpt = customerService.getCustomerById(id);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();

                // Update fields
                if (request.containsKey("email")) {
                    customer.setUsername((String) request.get("email"));
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