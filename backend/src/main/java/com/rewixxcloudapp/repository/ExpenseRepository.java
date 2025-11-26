package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, CustomExpenseRepository {

    List<Expense> findByJob_Id(Long jobId);

    List<Expense> findByCustomer_Id(Long customerId);

    @Query("SELECT e FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate ORDER BY e.expenseDate DESC")
    List<Expense> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Expense> findByType(com.rewixxcloudapp.entity.ExpenseType type);
}
