package com.rewixxcloudapp.repository.impl;

import com.rewixxcloudapp.entity.Expense;
import com.rewixxcloudapp.repository.CustomExpenseRepository;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.List;

public class CustomExpenseRepositoryImpl implements CustomExpenseRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Expense> findExpensesWithSearch(String searchTerm, String typeFilter, Long jobId, int page, int pageSize, Long userId) {
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT e FROM Expense e LEFT JOIN FETCH e.job LEFT JOIN FETCH e.customer WHERE e.userId = :userId"
        );

        // Add search term filter
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            queryBuilder.append(" AND (LOWER(e.description) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.employeeName) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.vendor) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.receiptNumber) LIKE LOWER(:searchTerm)")
                    .append(" OR CAST(e.amount AS string) LIKE :searchTerm)");
        }

        // Add type filter
        if (typeFilter != null && !typeFilter.trim().isEmpty() && !"All".equalsIgnoreCase(typeFilter)) {
            queryBuilder.append(" AND e.type = :typeFilter");
        }

        // Add job filter
        if (jobId != null) {
            queryBuilder.append(" AND e.job.id = :jobId");
        }

        queryBuilder.append(" ORDER BY e.expenseDate DESC, e.id DESC");

        TypedQuery<Expense> query = entityManager.createQuery(queryBuilder.toString(), Expense.class);
        
        query.setParameter("userId", userId);

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            query.setParameter("searchTerm", "%" + searchTerm.trim() + "%");
        }

        if (typeFilter != null && !typeFilter.trim().isEmpty() && !"All".equalsIgnoreCase(typeFilter)) {
            try {
                query.setParameter("typeFilter", com.rewixxcloudapp.entity.ExpenseType.valueOf(typeFilter.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Invalid type filter, ignore
            }
        }

        if (jobId != null) {
            query.setParameter("jobId", jobId);
        }

        query.setFirstResult(page * pageSize);
        query.setMaxResults(pageSize);

        return query.getResultList();
    }

    @Override
    public long countExpensesWithSearch(String searchTerm, String typeFilter, Long jobId, Long userId) {
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT COUNT(e) FROM Expense e WHERE e.userId = :userId"
        );

        // Add search term filter
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            queryBuilder.append(" AND (LOWER(e.description) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.employeeName) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.vendor) LIKE LOWER(:searchTerm)")
                    .append(" OR LOWER(e.receiptNumber) LIKE LOWER(:searchTerm)")
                    .append(" OR CAST(e.amount AS string) LIKE :searchTerm)");
        }

        // Add type filter
        if (typeFilter != null && !typeFilter.trim().isEmpty() && !"All".equalsIgnoreCase(typeFilter)) {
            queryBuilder.append(" AND e.type = :typeFilter");
        }

        // Add job filter
        if (jobId != null) {
            queryBuilder.append(" AND e.job.id = :jobId");
        }

        TypedQuery<Long> query = entityManager.createQuery(queryBuilder.toString(), Long.class);
        
        query.setParameter("userId", userId);

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            query.setParameter("searchTerm", "%" + searchTerm.trim() + "%");
        }

        if (typeFilter != null && !typeFilter.trim().isEmpty() && !"All".equalsIgnoreCase(typeFilter)) {
            try {
                query.setParameter("typeFilter", com.rewixxcloudapp.entity.ExpenseType.valueOf(typeFilter.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Invalid type filter, ignore
            }
        }

        if (jobId != null) {
            query.setParameter("jobId", jobId);
        }

        return query.getSingleResult();
    }
}
