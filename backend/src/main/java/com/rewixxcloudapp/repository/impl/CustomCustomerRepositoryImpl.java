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
    public List<Customer> findCustomersWithSearch(String searchTerm, int page, int pageSize, Long userId) {
        String baseQuery = "SELECT c FROM Customer c WHERE c.userId = :userId " +
                "AND (:searchTerm = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
                "ORDER BY c.name ASC";
        TypedQuery<Customer> query = entityManager.createQuery(baseQuery, Customer.class);
        query.setParameter("userId", userId);
        query.setParameter("searchTerm", searchTerm);
        query.setFirstResult(page * pageSize);
        query.setMaxResults(pageSize);
        return query.getResultList();
    }

    @Override
    public long countCustomersWithSearch(String searchTerm, Long userId) {
        String countQuery = "SELECT COUNT(c) FROM Customer c WHERE c.userId = :userId " +
                "AND (:searchTerm = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))";
        TypedQuery<Long> query = entityManager.createQuery(countQuery, Long.class);
        query.setParameter("userId", userId);
        query.setParameter("searchTerm", searchTerm);
        return query.getSingleResult();
    }
} 