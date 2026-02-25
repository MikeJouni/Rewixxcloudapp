package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.ExpenseDto;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Expense;
import com.rewixxcloudapp.entity.ExpenseType;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.repository.CustomerRepository;
import com.rewixxcloudapp.repository.ExpenseRepository;
import com.rewixxcloudapp.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ExpenseService {

    private static final Logger logger = LoggerFactory.getLogger(ExpenseService.class);

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public Optional<Expense> getExpenseById(Long id, Long userId) {
        logger.info("Fetching expense by ID: {} for user {}", id, userId);
        return expenseRepository.findByIdAndUserId(id, userId);
    }

    public Expense createExpense(ExpenseDto dto, Long userId) {
        logger.info("Creating expense with type: {}, amount: {}, date: {}",
                   dto.getType(), dto.getAmount(), dto.getExpenseDate());

        // Validate required fields
        if (dto.getType() == null || dto.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Expense type is required");
        }
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero");
        }
        if (dto.getExpenseDate() == null) {
            throw new IllegalArgumentException("Expense date is required");
        }

        // For labor expenses, validate labor-specific fields
        ExpenseType type;
        try {
            type = ExpenseType.valueOf(dto.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid expense type: " + dto.getType());
        }

        if (type == ExpenseType.LABOR) {
            if (dto.getEmployeeName() == null || dto.getEmployeeName().trim().isEmpty()) {
                throw new IllegalArgumentException("Employee name is required for labor expenses");
            }
            if (dto.getHoursWorked() == null || dto.getHoursWorked().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Hours worked must be greater than zero for labor expenses");
            }
        }

        Expense expense = new Expense();
        expense.setUserId(userId);
        expense.setType(type);
        expense.setAmount(dto.getAmount());
        expense.setDescription(dto.getDescription());
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setEmployeeName(dto.getEmployeeName());
        expense.setHoursWorked(dto.getHoursWorked());
        expense.setHourlyRate(dto.getHourlyRate());
        expense.setVendor(dto.getVendor());
        expense.setReceiptNumber(dto.getReceiptNumber());
        expense.setBillable(dto.getBillable() != null ? dto.getBillable() : false);

        // Set job relationship if provided - verify it belongs to the user
        if (dto.getJobId() != null) {
            Optional<Job> jobOpt = jobRepository.findByIdAndUserId(dto.getJobId(), userId);
            if (jobOpt.isPresent()) {
                expense.setJob(jobOpt.get());
                logger.info("Associated expense with job ID: {}", dto.getJobId());
            } else {
                logger.warn("Job not found with ID: {} for user {}, proceeding without job association", dto.getJobId(), userId);
                throw new IllegalArgumentException("Job not found or does not belong to you");
            }
        }

        // Set customer relationship if provided - verify it belongs to the user
        if (dto.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerRepository.findByIdAndUserId(dto.getCustomerId(), userId);
            if (customerOpt.isPresent()) {
                expense.setCustomer(customerOpt.get());
                logger.info("Associated expense with customer ID: {}", dto.getCustomerId());
            } else {
                logger.warn("Customer not found with ID: {} for user {}, proceeding without customer association", dto.getCustomerId(), userId);
                throw new IllegalArgumentException("Customer not found or does not belong to you");
            }
        }

        Expense savedExpense = expenseRepository.save(expense);
        logger.info("Expense created successfully with ID: {}", savedExpense.getId());
        return savedExpense;
    }

    public Expense updateExpenseFromDto(Expense expense, ExpenseDto dto) {
        logger.info("Updating expense {} with data from DTO", expense.getId());

        // Update type if provided
        if (dto.getType() != null && !dto.getType().trim().isEmpty()) {
            try {
                ExpenseType type = ExpenseType.valueOf(dto.getType().toUpperCase());
                logger.info("Setting type to: {}", type);
                expense.setType(type);

                // Validate labor-specific fields if type is LABOR
                if (type == ExpenseType.LABOR) {
                    if (dto.getEmployeeName() == null || dto.getEmployeeName().trim().isEmpty()) {
                        throw new IllegalArgumentException("Employee name is required for labor expenses");
                    }
                    if (dto.getHoursWorked() == null || dto.getHoursWorked().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new IllegalArgumentException("Hours worked must be greater than zero for labor expenses");
                    }
                }
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid expense type provided: {}", dto.getType());
            }
        }

        // Update amount if provided
        if (dto.getAmount() != null) {
            if (dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Expense amount must be greater than zero");
            }
            logger.info("Setting amount to: {}", dto.getAmount());
            expense.setAmount(dto.getAmount());
        }

        // Update description
        if (dto.getDescription() != null) {
            logger.info("Setting description");
            expense.setDescription(dto.getDescription());
        }

        // Update expense date
        if (dto.getExpenseDate() != null) {
            logger.info("Setting expense date to: {}", dto.getExpenseDate());
            expense.setExpenseDate(dto.getExpenseDate());
        }

        // Update labor fields
        if (dto.getEmployeeName() != null) {
            logger.info("Setting employee name to: {}", dto.getEmployeeName());
            expense.setEmployeeName(dto.getEmployeeName());
        }
        if (dto.getHoursWorked() != null) {
            logger.info("Setting hours worked to: {}", dto.getHoursWorked());
            expense.setHoursWorked(dto.getHoursWorked());
        }
        if (dto.getHourlyRate() != null) {
            logger.info("Setting hourly rate to: {}", dto.getHourlyRate());
            expense.setHourlyRate(dto.getHourlyRate());
        }

        // Update other fields
        if (dto.getVendor() != null) {
            expense.setVendor(dto.getVendor());
        }
        if (dto.getReceiptNumber() != null) {
            expense.setReceiptNumber(dto.getReceiptNumber());
        }
        if (dto.getBillable() != null) {
            expense.setBillable(dto.getBillable());
        }

        // Update job relationship - verify it belongs to the user
        if (dto.getJobId() != null) {
            Optional<Job> jobOpt = jobRepository.findByIdAndUserId(dto.getJobId(), expense.getUserId());
            if (jobOpt.isPresent()) {
                logger.info("Setting job to: {}", jobOpt.get().getTitle());
                expense.setJob(jobOpt.get());
            } else {
                logger.warn("Job not found with ID: {} for user {}", dto.getJobId(), expense.getUserId());
                throw new IllegalArgumentException("Job not found or does not belong to you");
            }
        }

        // Update customer relationship - verify it belongs to the user
        if (dto.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerRepository.findByIdAndUserId(dto.getCustomerId(), expense.getUserId());
            if (customerOpt.isPresent()) {
                logger.info("Setting customer to: {}", customerOpt.get().getName());
                expense.setCustomer(customerOpt.get());
            } else {
                logger.warn("Customer not found with ID: {} for user {}", dto.getCustomerId(), expense.getUserId());
                throw new IllegalArgumentException("Customer not found or does not belong to you");
            }
        }

        logger.info("Saving expense to database...");
        Expense savedExpense = expenseRepository.save(expense);
        logger.info("Expense saved successfully with ID: {}", savedExpense.getId());
        return savedExpense;
    }

    public void deleteExpenseById(Long id, Long userId) {
        logger.info("Deleting expense with ID: {} for user {}", id, userId);
        Optional<Expense> expenseOpt = expenseRepository.findByIdAndUserId(id, userId);
        if (expenseOpt.isEmpty()) {
            throw new IllegalArgumentException("Expense not found");
        }
        expenseRepository.deleteById(id);
    }

    public Map<String, Object> getExpensesList(int page, int pageSize, String searchTerm, String typeFilter, Long jobId, Long userId) {
        logger.info("Fetching expenses list - page: {}, pageSize: {}, searchTerm: '{}', typeFilter: '{}', jobId: {}, userId: {}",
                   page, pageSize, searchTerm, typeFilter, jobId, userId);

        List<Expense> expenses = expenseRepository.findExpensesWithSearch(searchTerm, typeFilter, jobId, page, pageSize, userId);
        long totalExpenses = expenseRepository.countExpensesWithSearch(searchTerm, typeFilter, jobId, userId);
        int totalPages = (int) Math.ceil((double) totalExpenses / pageSize);

        logger.info("Found {} total expenses, returning page {} of {}", totalExpenses, page + 1, totalPages);

        Map<String, Object> response = new HashMap<>();
        response.put("expenses", expenses);
        response.put("totalExpenses", totalExpenses);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("pageSize", pageSize);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);

        return response;
    }

    // Additional methods for reporting
    public List<Expense> getExpensesByJob(Long jobId, Long userId) {
        logger.info("Fetching expenses for job ID: {} for user {}", jobId, userId);
        return expenseRepository.findByJobIdAndUserId(jobId, userId);
    }

    public List<Expense> getExpensesByDateRange(LocalDate startDate, LocalDate endDate, Long userId) {
        logger.info("Fetching expenses between {} and {} for user {}", startDate, endDate, userId);
        return expenseRepository.findByDateRangeAndUserId(startDate, endDate, userId);
    }

    public BigDecimal getTotalExpensesByJob(Long jobId, Long userId) {
        logger.info("Calculating total expenses for job ID: {} for user {}", jobId, userId);
        List<Expense> expenses = expenseRepository.findByJobIdAndUserId(jobId, userId);
        return expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
