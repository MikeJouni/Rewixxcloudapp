package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p WHERE p.job.id = :jobId ORDER BY p.paymentDate DESC")
    List<Payment> findByJobId(@Param("jobId") Long jobId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.job.id = :jobId")
    BigDecimal getTotalPaidByJobId(@Param("jobId") Long jobId);
}
