package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Supplier;
import com.rewixxcloudapp.entity.User;
import com.rewixxcloudapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Collection<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Customer createCustomer(String username, String password, String name) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }

        String encodedPassword = passwordEncoder.encode(password);
        Customer customer = new Customer(username, encodedPassword, name);
        return userRepository.save(customer);
    }

    public Supplier createSupplier(String username, String password, String name) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }

        String encodedPassword = passwordEncoder.encode(password);
        Supplier supplier = new Supplier(username, encodedPassword, name);
        return userRepository.save(supplier);
    }

    public User saveUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        // If this is a new user and password is not encoded, encode it
        if (user.getId() == null && user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with ID: " + id);
        }

        userRepository.deleteById(id);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public void updatePassword(Long userId, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with ID: " + userId);
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public Optional<Customer> getCustomerById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent() && user.get() instanceof Customer) {
            return Optional.of((Customer) user.get());
        }
        return Optional.empty();
    }

    public Customer saveCustomer(Customer customer) {
        return userRepository.save(customer);
    }

    public Map<String, Object> getCustomersList(int page, int pageSize, String searchTerm) {
        // Get all users and filter for customers
        Collection<User> allUsers = userRepository.findAll();
        List<Customer> customers = allUsers.stream()
                .filter(user -> user instanceof Customer)
                .map(user -> (Customer) user)
                .filter(customer -> 
                    searchTerm.isEmpty() || 
                    customer.getName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                    customer.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                    (customer.getPhone() != null && customer.getPhone().contains(searchTerm))
                )
                .collect(java.util.stream.Collectors.toList());
        
        // Calculate pagination
        int totalCustomers = customers.size();
        int totalPages = (int) Math.ceil((double) totalCustomers / pageSize);
        int startIndex = page * pageSize;
        int endIndex = Math.min(startIndex + pageSize, totalCustomers);
        
        // Get the page of customers
        List<Customer> pageCustomers = customers.subList(startIndex, endIndex);
        
        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("customers", pageCustomers);
        result.put("totalCustomers", totalCustomers);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);
        result.put("pageSize", pageSize);
        result.put("hasNext", page < totalPages - 1);
        result.put("hasPrevious", page > 0);
        
        return result;
    }
}