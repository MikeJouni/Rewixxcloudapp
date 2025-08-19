package com.rewixxcloudapp.repository.impl;

import com.rewixxcloudapp.repository.CustomCustomerRepository;

import com.rewixxcloudapp.entity.Customer;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.List;

public class CustomCustomerRepositoryImpl implements CustomCustomerRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Customer> findCustomersWithSearch(String searchTerm, int page, int pageSize) {
        String baseQuery = "SELECT c FROM Customer c WHERE " +
                "(:searchTerm = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(c.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR (c.phone IS NOT NULL AND c.phone LIKE CONCAT('%', :searchTerm, '%'))) " +
                "ORDER BY c.name ASC";
        TypedQuery<Customer> query = entityManager.createQuery(baseQuery, Customer.class);
        query.setParameter("searchTerm", searchTerm);
        query.setFirstResult(page * pageSize);
        query.setMaxResults(pageSize);
        return query.getResultList();
    }

    @Override
    public long countCustomersWithSearch(String searchTerm) {
        String countQuery = "SELECT COUNT(c) FROM Customer c WHERE " +
                "(:searchTerm = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR LOWER(c.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                "OR (c.phone IS NOT NULL AND c.phone LIKE CONCAT('%', :searchTerm, '%')))";
        TypedQuery<Long> query = entityManager.createQuery(countQuery, Long.class);
        query.setParameter("searchTerm", searchTerm);
        return query.getSingleResult();
    }
} 