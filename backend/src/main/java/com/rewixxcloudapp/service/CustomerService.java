package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.repository.CustomerRepository;
import com.rewixxcloudapp.repository.JobRepository;
import com.rewixxcloudapp.dto.CustomerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer createCustomer(CustomerDto dto) {
        if (customerRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        Customer customer = new Customer(dto.getUsername(), null, dto.getName());
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            customer.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        customer.setPhone(dto.getPhone());
        customer.setAddressLine1(dto.getAddressLine1());
        customer.setAddressLine2(dto.getAddressLine2());
        customer.setCity(dto.getCity());
        customer.setState(dto.getState());
        customer.setZip(dto.getZip());
        return customerRepository.save(customer);
    }

    public Customer updateCustomerFromDto(Customer customer, CustomerDto dto) {
        if (dto.getUsername() != null)
            customer.setUsername(dto.getUsername());
        if (dto.getName() != null)
            customer.setName(dto.getName());
        if (dto.getPhone() != null)
            customer.setPhone(dto.getPhone());
        if (dto.getAddressLine1() != null)
            customer.setAddressLine1(dto.getAddressLine1());
        if (dto.getAddressLine2() != null)
            customer.setAddressLine2(dto.getAddressLine2());
        if (dto.getCity() != null)
            customer.setCity(dto.getCity());
        if (dto.getState() != null)
            customer.setState(dto.getState());
        if (dto.getZip() != null)
            customer.setZip(dto.getZip());
        // Only update password if provided and not blank
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            customer.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return customerRepository.save(customer);
    }

    public void deleteCustomerById(Long id) {
        try {
            // First delete all jobs associated with this customer
            List<Job> customerJobs = jobRepository.findByCustomerId(id);
            if (customerJobs != null && !customerJobs.isEmpty()) {
                logger.info("Deleting {} jobs associated with customer ID {}", customerJobs.size(), id);
                jobRepository.deleteAll(customerJobs);
                logger.info("Successfully deleted {} jobs for customer ID {}", customerJobs.size(), id);
            } else {
                logger.info("No jobs found for customer ID {}", id);
            }
            
            // Now delete the customer
            customerRepository.deleteById(id);
            logger.info("Customer with ID {} deleted successfully", id);
        } catch (Exception e) {
            logger.error("Error deleting customer with ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete customer: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getCustomersList(int page, int pageSize, String searchTerm) {
        List<Customer> customers = customerRepository.findCustomersWithSearch(searchTerm, page, pageSize);
        long totalCustomers = customerRepository.countCustomersWithSearch(searchTerm);
        int totalPages = (int) Math.ceil((double) totalCustomers / pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("customers", customers);
        result.put("totalCustomers", totalCustomers);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);
        result.put("pageSize", pageSize);
        result.put("hasNext", page < totalPages - 1);
        result.put("hasPrevious", page > 0);

        return result;
    }
}