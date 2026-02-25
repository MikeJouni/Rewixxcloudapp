package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Product> findByNameContainingIgnoreCase(@Param("name") String name);
    
    // Add exact name match for better duplicate prevention
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) = LOWER(:name)")
    List<Product> findByNameIgnoreCase(@Param("name") String name);
}
