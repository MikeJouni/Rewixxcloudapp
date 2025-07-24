package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long>, CustomCustomerRepository {
} 