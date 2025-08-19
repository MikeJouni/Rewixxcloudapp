package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, CustomJobRepository {
    List<Job> findByCustomerId(Long customerId);
}
