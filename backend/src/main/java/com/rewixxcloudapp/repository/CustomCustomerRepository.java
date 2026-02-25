package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Customer;
import java.util.List;

public interface CustomCustomerRepository {
    List<Customer> findCustomersWithSearch(String searchTerm, int page, int pageSize, Long userId);
    long countCustomersWithSearch(String searchTerm, Long userId);
} 