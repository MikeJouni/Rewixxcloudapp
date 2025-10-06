package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long>, CustomCustomerRepository {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByPhone(String phone);
}