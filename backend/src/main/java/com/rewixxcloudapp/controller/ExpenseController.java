package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.dto.ExpenseDto;
import com.rewixxcloudapp.entity.Expense;
import com.rewixxcloudapp.service.ExpenseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private static final Logger logger = LoggerFactory.getLogger(ExpenseController.class);

    @Autowired
    private ExpenseService expenseService;

    @PostMapping("/create")
    public ResponseEntity<?> createExpense(@RequestBody ExpenseDto dto) {
        try {
            logger.info("Received expense creation request: {}", dto);

            // Validate required fields
            if (dto.getType() == null || dto.getType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Expense type is required");
            }
            if (dto.getAmount() == null) {
                return ResponseEntity.badRequest().body("Expense amount is required");
            }
            if (dto.getExpenseDate() == null) {
                return ResponseEntity.badRequest().body("Expense date is required");
            }

            Expense expense = expenseService.createExpense(dto);
            logger.info("Expense created successfully with ID: {}", expense.getId());
            return ResponseEntity.ok(expense);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument when creating expense: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating expense", e);
            return ResponseEntity.internalServerError().body("Error creating expense: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id) {
        try {
            logger.info("Fetching expense with ID: {}", id);
            Optional<Expense> expense = expenseService.getExpenseById(id);
            if (expense.isPresent()) {
                return ResponseEntity.ok(expense.get());
            } else {
                logger.warn("Expense not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error getting expense by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody ExpenseDto dto) {
        try {
            logger.info("Received update request for expense ID: {}", id);

            Optional<Expense> expenseOpt = expenseService.getExpenseById(id);
            if (expenseOpt.isPresent()) {
                Expense existing = expenseOpt.get();
                logger.info("Found existing expense: {}", existing.getId());
                Expense updatedExpense = expenseService.updateExpenseFromDto(existing, dto);
                logger.info("Expense updated successfully: {}", updatedExpense.getId());
                return ResponseEntity.ok(updatedExpense);
            } else {
                logger.warn("Expense not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument when updating expense {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating expense: {}", id, e);
            return ResponseEntity.internalServerError().body("Error updating expense: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        try {
            Optional<Expense> expenseOpt = expenseService.getExpenseById(id);
            if (expenseOpt.isPresent()) {
                expenseService.deleteExpenseById(id);
                logger.info("Expense deleted successfully: {}", id);
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Expense not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error deleting expense: {}", id, e);
            return ResponseEntity.internalServerError().body("Error deleting expense: " + e.getMessage());
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> listExpenses(@RequestBody Map<String, Object> params) {
        try {
            int page = params.containsKey("page") ? (Integer) params.get("page") : 0;
            int pageSize = params.containsKey("pageSize") ? (Integer) params.get("pageSize") : 10;
            String searchTerm = params.containsKey("searchTerm") ? (String) params.get("searchTerm") : "";
            String typeFilter = params.containsKey("typeFilter") ? (String) params.get("typeFilter") : "All";
            Long jobId = params.containsKey("jobId") ?
                ((Number) params.get("jobId")).longValue() : null;

            logger.info("Listing expenses - page: {}, pageSize: {}, searchTerm: '{}', typeFilter: '{}', jobId: {}",
                       page, pageSize, searchTerm, typeFilter, jobId);

            Map<String, Object> response = expenseService.getExpensesList(page, pageSize, searchTerm, typeFilter, jobId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error listing expenses", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching expenses: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getExpensesByJob(@PathVariable Long jobId) {
        try {
            logger.info("Fetching expenses for job ID: {}", jobId);
            var expenses = expenseService.getExpensesByJob(jobId);
            var totalAmount = expenseService.getTotalExpensesByJob(jobId);

            Map<String, Object> response = new HashMap<>();
            response.put("expenses", expenses);
            response.put("totalAmount", totalAmount);
            response.put("count", expenses.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching expenses for job: {}", jobId, e);
            return ResponseEntity.internalServerError().body("Error fetching job expenses: " + e.getMessage());
        }
    }
}
