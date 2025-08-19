package com.rewixxcloudapp.repository.impl;

import com.rewixxcloudapp.repository.CustomJobRepository;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.JobStatus;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.List;

public class CustomJobRepositoryImpl implements CustomJobRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Job> findJobsWithSearch(String searchTerm, String statusFilter, int page, int pageSize) {
        JobStatus statusEnum = null;
        if (statusFilter != null && !statusFilter.equalsIgnoreCase("All")) {
            try {
                statusEnum = JobStatus.valueOf(statusFilter);
            } catch (IllegalArgumentException ignored) {
                statusEnum = null;
            }
        }

        String baseQuery = "SELECT j FROM Job j LEFT JOIN j.customer c WHERE " +
                "(:searchTerm = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.status) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.priority) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR (c IS NOT NULL AND LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) " +
                "AND (:statusEnum IS NULL OR j.status = :statusEnum) " +
                "ORDER BY j.id DESC";
        TypedQuery<Job> query = entityManager.createQuery(baseQuery, Job.class);
        query.setParameter("searchTerm", searchTerm);
        query.setParameter("statusEnum", statusEnum);
        query.setFirstResult(page * pageSize);
        query.setMaxResults(pageSize);
        return query.getResultList();
    }

    @Override
    public long countJobsWithSearch(String searchTerm, String statusFilter) {
        JobStatus statusEnum = null;
        if (statusFilter != null && !statusFilter.equalsIgnoreCase("All")) {
            try {
                statusEnum = JobStatus.valueOf(statusFilter);
            } catch (IllegalArgumentException ignored) {
                statusEnum = null;
            }
        }
        String countQuery = "SELECT COUNT(j) FROM Job j LEFT JOIN j.customer c WHERE " +
                "(:searchTerm = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.status) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(j.priority) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR (c IS NOT NULL AND LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) " +
                "AND (:statusEnum IS NULL OR j.status = :statusEnum)";
        TypedQuery<Long> query = entityManager.createQuery(countQuery, Long.class);
        query.setParameter("searchTerm", searchTerm);
        query.setParameter("statusEnum", statusEnum);
        return query.getSingleResult();
    }
}
