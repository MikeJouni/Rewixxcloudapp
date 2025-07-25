package com.rewixxcloudapp.repository.impl;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import com.rewixxcloudapp.repository.CustomUserRepository;

public class CustomUserRepositoryImpl implements CustomUserRepository {
    @PersistenceContext
    private EntityManager entityManager;
    // Add custom user queries here
}
