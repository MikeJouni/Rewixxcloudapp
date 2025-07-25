package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer createCustomer(String username, String password, String name) {
        Customer customer = new Customer(username, password, name);
        return customerRepository.save(customer);
    }

    public void deleteCustomerById(Long id) {
        customerRepository.deleteById(id);
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