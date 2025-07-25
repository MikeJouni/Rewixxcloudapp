package com.rewixxcloudapp.controller;

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

    @GetMapping("/all")
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

}