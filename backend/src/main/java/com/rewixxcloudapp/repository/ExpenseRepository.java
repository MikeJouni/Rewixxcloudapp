package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, CustomExpenseRepository {

    @Query("SELECT e FROM Expense e WHERE e.job.id = :jobId AND e.userId = :userId")
    List<Expense> findByJobIdAndUserId(@Param("jobId") Long jobId, @Param("userId") Long userId);

    @Query("SELECT e FROM Expense e WHERE e.customer.id = :customerId AND e.userId = :userId")
    List<Expense> findByCustomerIdAndUserId(@Param("customerId") Long customerId, @Param("userId") Long userId);

    @Query("SELECT e FROM Expense e WHERE e.userId = :userId AND e.expenseDate BETWEEN :startDate AND :endDate ORDER BY e.expenseDate DESC")
    List<Expense> findByDateRangeAndUserId(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("userId") Long userId);

    @Query("SELECT e FROM Expense e WHERE e.userId = :userId AND e.type = :type")
    List<Expense> findByTypeAndUserId(@Param("type") com.rewixxcloudapp.entity.ExpenseType type, @Param("userId") Long userId);

    // Delete all expenses associated with a given employee name (used when deleting an employee)
    @Modifying
    @Query("DELETE FROM Expense e WHERE e.userId = :userId AND e.employeeName = :employeeName")
    void deleteByEmployeeNameAndUserId(@Param("employeeName") String employeeName, @Param("userId") Long userId);
    
    Optional<Expense> findByIdAndUserId(Long id, Long userId);
}
