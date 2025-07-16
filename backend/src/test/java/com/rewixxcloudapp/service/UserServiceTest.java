package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Supplier;
import com.rewixxcloudapp.entity.User;
import com.rewixxcloudapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    public void testCreateCustomer() {
        // Given
        String username = "testcustomer";
        String password = "password123";
        String name = "Test Customer";
        String encodedPassword = "encoded_password";

        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);
        when(userRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            customer.setId(1L);
            return customer;
        });

        // When
        Customer customer = userService.createCustomer(username, password, name);

        // Then
        assertNotNull(customer);
        assertEquals(username, customer.getUsername());
        assertEquals(encodedPassword, customer.getPassword());
        assertEquals(name, customer.getName());
        assertEquals(1L, customer.getId());
    }

    @Test
    public void testCreateSupplier() {
        // Given
        String username = "testsupplier";
        String password = "password123";
        String name = "Test Supplier";
        String encodedPassword = "encoded_password";

        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);
        when(userRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier supplier = invocation.getArgument(0);
            supplier.setId(1L);
            return supplier;
        });

        // When
        Supplier supplier = userService.createSupplier(username, password, name);

        // Then
        assertNotNull(supplier);
        assertEquals(username, supplier.getUsername());
        assertEquals(encodedPassword, supplier.getPassword());
        assertEquals(name, supplier.getName());
        assertEquals(1L, supplier.getId());
    }

    @Test
    public void testCreateCustomerWithExistingUsername() {
        // Given
        String username = "existinguser";
        when(userRepository.existsByUsername(username)).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            userService.createCustomer(username, "password", "name");
        });
    }

    @Test
    public void testGetUserByUsername() {
        // Given
        String username = "testuser";
        Customer customer = new Customer(username, "password", "Test User");
        customer.setId(1L);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(customer));

        // When
        Optional<User> result = userService.getUserByUsername(username);

        // Then
        assertTrue(result.isPresent());
        assertEquals(username, result.get().getUsername());
    }
}