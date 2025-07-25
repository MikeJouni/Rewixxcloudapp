package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Customer;
import java.util.List;

public interface CustomCustomerRepository {
    List<Customer> findCustomersWithSearch(String searchTerm, int page, int pageSize);
    long countCustomersWithSearch(String searchTerm);
} 