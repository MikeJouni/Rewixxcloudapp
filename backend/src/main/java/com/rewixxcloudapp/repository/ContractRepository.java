package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByUserIdOrderByContractDateDesc(Long userId);

    Page<Contract> findByUserId(Long userId, Pageable pageable);

    Optional<Contract> findByIdAndUserId(Long id, Long userId);

    Page<Contract> findByUserIdAndCustomerNameContainingIgnoreCase(Long userId, String customerName, Pageable pageable);
}
