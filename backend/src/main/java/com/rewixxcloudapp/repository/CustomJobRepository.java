package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Job;
import java.util.List;

public interface CustomJobRepository {
    List<Job> findJobsWithSearch(String searchTerm, String statusFilter, int page, int pageSize, Long userId);
    long countJobsWithSearch(String searchTerm, String statusFilter, Long userId);
}
