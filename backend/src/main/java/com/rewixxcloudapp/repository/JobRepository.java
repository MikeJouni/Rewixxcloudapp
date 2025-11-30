package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long>, CustomJobRepository {
    List<Job> findByCustomerIdAndUserId(Long customerId, Long userId);
    
    @Query("SELECT j FROM Job j WHERE j.userId = :userId AND ((j.startDate BETWEEN :startDate AND :endDate) OR (j.endDate BETWEEN :startDate AND :endDate) OR (j.startDate <= :startDate AND j.endDate >= :endDate))")
    List<Job> findByDateRangeAndUserId(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("userId") Long userId);
    
    Optional<Job> findByIdAndUserId(Long id, Long userId);
}
