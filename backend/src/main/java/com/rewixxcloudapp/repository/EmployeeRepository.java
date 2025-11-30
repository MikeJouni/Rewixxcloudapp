package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find active employees only
    List<Employee> findByActiveTrueAndUserId(Long userId);

    // Find employees by name (case-insensitive)
    @Query("SELECT e FROM Employee e WHERE e.userId = :userId AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(e.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Employee> searchEmployees(@Param("searchTerm") String searchTerm, @Param("userId") Long userId);

    List<Employee> findByUserId(Long userId);
    
    Optional<Employee> findByIdAndUserId(Long id, Long userId);
}
