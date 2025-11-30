package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long>, CustomCustomerRepository {
    Optional<Customer> findByUsernameAndUserId(String username, Long userId);
    Optional<Customer> findByPhoneAndUserId(String phone, Long userId);
    Optional<Customer> findByIdAndUserId(Long id, Long userId);
}