package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Supplier;
import com.rewixxcloudapp.entity.User;
import com.rewixxcloudapp.service.UserService;
import com.rewixxcloudapp.util.JsonSerializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<String> getAllUsers() {
        try {
            Collection<User> users = userService.getAllUsers();
            return ResponseEntity.ok(JsonSerializer.toJsonArray(users));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving users: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<String> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userService.getUserById(id);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get().toJson());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving user: " + e.getMessage());
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<String> getUserByUsername(@PathVariable String username) {
        try {
            Optional<User> user = userService.getUserByUsername(username);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get().toJson());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving user: " + e.getMessage());
        }
    }

    @PostMapping("/customers")
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

    @PostMapping("/suppliers")
    public ResponseEntity<String> createSupplier(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String name = request.get("name");

            if (username == null || password == null || name == null) {
                return ResponseEntity.badRequest().body("Username, password, and name are required");
            }

            Supplier supplier = userService.createSupplier(username, password, name);
            
            // Fetch the fully initialized supplier to avoid serialization issues
            Optional<User> loadedSupplier = userService.getUserById(supplier.getId());
            if (loadedSupplier.isPresent()) {
                return ResponseEntity.ok(loadedSupplier.get().toJson());
            } else {
                return ResponseEntity.ok(supplier.toJson());
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating supplier: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<User> existingUser = userService.getUserById(id);
            if (existingUser.isPresent()) {
                User user = existingUser.get();

                // Update fields if provided
                if (request.containsKey("username")) {
                    user.setUsername((String) request.get("username"));
                }
                if (request.containsKey("enabled")) {
                    user.setEnabled((Boolean) request.get("enabled"));
                }
                if (request.containsKey("phone")) {
                    user.setPhone((String) request.get("phone"));
                }
                if (request.containsKey("addressLine1")) {
                    user.setAddressLine1((String) request.get("addressLine1"));
                }
                if (request.containsKey("addressLine2")) {
                    user.setAddressLine2((String) request.get("addressLine2"));
                }
                if (request.containsKey("city")) {
                    user.setCity((String) request.get("city"));
                }
                if (request.containsKey("state")) {
                    user.setState((String) request.get("state"));
                }
                if (request.containsKey("zip")) {
                    user.setZip((String) request.get("zip"));
                }

                User updatedUser = userService.saveUser(user);
                return ResponseEntity.ok(updatedUser.toJson());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating user: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<String> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String newPassword = request.get("password");
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            userService.updatePassword(id, newPassword);
            return ResponseEntity.ok("Password updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating password: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("User deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error deleting user: " + e.getMessage());
        }
    }

    @GetMapping("/check-username/{username}")
    public ResponseEntity<String> checkUsernameAvailability(@PathVariable String username) {
        try {
            boolean exists = userService.existsByUsername(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("available", !exists);
            return ResponseEntity.ok(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error checking username: " + e.getMessage());
        }
    }
    
    @GetMapping("/customers/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        try {
            Optional<Customer> customer = userService.getCustomerById(id);
            return customer.map(ResponseEntity::ok)
                           .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/customers/{id}")
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

    @PostMapping("/customers/list")
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