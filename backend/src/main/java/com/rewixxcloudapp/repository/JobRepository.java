package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, CustomJobRepository {
    List<Job> findByCustomerId(Long customerId);
    
    @Query("SELECT j FROM Job j WHERE (j.startDate BETWEEN :startDate AND :endDate) OR (j.endDate BETWEEN :startDate AND :endDate) OR (j.startDate <= :startDate AND j.endDate >= :endDate)")
    List<Job> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
