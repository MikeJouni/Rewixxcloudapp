package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.Expense;
import java.util.List;

public interface CustomExpenseRepository {
    List<Expense> findExpensesWithSearch(String searchTerm, String typeFilter, Long jobId, int page, int pageSize, Long userId);
    long countExpensesWithSearch(String searchTerm, String typeFilter, Long jobId, Long userId);
}
