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

    public Optional<Expense> getExpenseById(Long id) {
        logger.info("Fetching expense by ID: {}", id);
        return expenseRepository.findById(id);
    }

    public Expense createExpense(ExpenseDto dto) {
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

        // Set job relationship if provided
        if (dto.getJobId() != null) {
            Optional<Job> jobOpt = jobRepository.findById(dto.getJobId());
            if (jobOpt.isPresent()) {
                expense.setJob(jobOpt.get());
                logger.info("Associated expense with job ID: {}", dto.getJobId());
            } else {
                logger.warn("Job not found with ID: {}, proceeding without job association", dto.getJobId());
            }
        }

        // Set customer relationship if provided
        if (dto.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerRepository.findById(dto.getCustomerId());
            if (customerOpt.isPresent()) {
                expense.setCustomer(customerOpt.get());
                logger.info("Associated expense with customer ID: {}", dto.getCustomerId());
            } else {
                logger.warn("Customer not found with ID: {}, proceeding without customer association", dto.getCustomerId());
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

        // Update job relationship
        if (dto.getJobId() != null) {
            Optional<Job> jobOpt = jobRepository.findById(dto.getJobId());
            if (jobOpt.isPresent()) {
                logger.info("Setting job to: {}", jobOpt.get().getTitle());
                expense.setJob(jobOpt.get());
            }
        }

        // Update customer relationship
        if (dto.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerRepository.findById(dto.getCustomerId());
            if (customerOpt.isPresent()) {
                logger.info("Setting customer to: {}", customerOpt.get().getName());
                expense.setCustomer(customerOpt.get());
            }
        }

        logger.info("Saving expense to database...");
        Expense savedExpense = expenseRepository.save(expense);
        logger.info("Expense saved successfully with ID: {}", savedExpense.getId());
        return savedExpense;
    }

    public void deleteExpenseById(Long id) {
        logger.info("Deleting expense with ID: {}", id);
        expenseRepository.deleteById(id);
    }

    public Map<String, Object> getExpensesList(int page, int pageSize, String searchTerm, String typeFilter, Long jobId) {
        logger.info("Fetching expenses list - page: {}, pageSize: {}, searchTerm: '{}', typeFilter: '{}', jobId: {}",
                   page, pageSize, searchTerm, typeFilter, jobId);

        List<Expense> expenses = expenseRepository.findExpensesWithSearch(searchTerm, typeFilter, jobId, page, pageSize);
        long totalExpenses = expenseRepository.countExpensesWithSearch(searchTerm, typeFilter, jobId);
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
    public List<Expense> getExpensesByJob(Long jobId) {
        logger.info("Fetching expenses for job ID: {}", jobId);
        return expenseRepository.findByJobId(jobId);
    }

    public List<Expense> getExpensesByDateRange(LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching expenses between {} and {}", startDate, endDate);
        return expenseRepository.findByDateRange(startDate, endDate);
    }

    public BigDecimal getTotalExpensesByJob(Long jobId) {
        logger.info("Calculating total expenses for job ID: {}", jobId);
        List<Expense> expenses = expenseRepository.findByJobId(jobId);
        return expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
