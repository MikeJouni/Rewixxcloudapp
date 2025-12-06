package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.*;
import com.rewixxcloudapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CustomerRepository customerRepository;

    // ProductRepository not currently used but available for future enhancements

    // Revenue Report
    public Map<String, Object> generateRevenueReport(LocalDate startDate, LocalDate endDate, Long userId) {
        List<Job> jobs = jobRepository.findByDateRangeAndUserId(startDate, endDate, userId);
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalMaterials = BigDecimal.ZERO;
        BigDecimal totalLabor = BigDecimal.ZERO;
        int totalJobs = jobs.size();
        int completedJobs = 0;
        
        Map<String, BigDecimal> revenueByCustomer = new HashMap<>();
        Map<String, Integer> jobsByStatus = new HashMap<>();
        
        for (Job job : jobs) {
            if (job.getStatus() == JobStatus.COMPLETED) {
                completedJobs++;
            }
            
            // Count jobs by status
            String status = job.getStatus().toString();
            jobsByStatus.put(status, jobsByStatus.getOrDefault(status, 0) + 1);
            
            // Calculate job revenue
            BigDecimal jobRevenue = calculateJobRevenue(job);
            totalRevenue = totalRevenue.add(jobRevenue);
            
            // Revenue by customer
            if (job.getCustomer() != null) {
                String customerName = job.getCustomer().getName();
                revenueByCustomer.put(customerName, 
                    revenueByCustomer.getOrDefault(customerName, BigDecimal.ZERO).add(jobRevenue));
            }
            
            // Calculate materials and labor costs
            BigDecimal materialsCost = calculateMaterialsCost(job);
            BigDecimal laborCost = calculateLaborCost(job);
            totalMaterials = totalMaterials.add(materialsCost);
            totalLabor = totalLabor.add(laborCost);
        }
        
        Map<String, Object> report = new HashMap<>();
        report.put("period", Map.of("startDate", startDate, "endDate", endDate));
        report.put("summary", Map.of(
            "totalRevenue", totalRevenue,
            "totalMaterials", totalMaterials,
            "totalLabor", totalLabor,
            "totalJobs", totalJobs,
            "completedJobs", completedJobs,
            "completionRate", totalJobs > 0 ? (double) completedJobs / totalJobs * 100 : 0
        ));
        report.put("revenueByCustomer", revenueByCustomer);
        report.put("jobsByStatus", jobsByStatus);
        
        return report;
    }
    
    // Labor Report
    public Map<String, Object> generateLaborReport(LocalDate startDate, LocalDate endDate, Long userId) {
        List<Job> jobs = jobRepository.findByDateRangeAndUserId(startDate, endDate, userId);
        
        int totalEstimatedHours = 0;
        int totalActualHours = 0;
        BigDecimal totalLaborCost = BigDecimal.ZERO;
        Map<String, Integer> hoursByStatus = new HashMap<>();
        Map<String, BigDecimal> laborCostByCustomer = new HashMap<>();
        
        for (Job job : jobs) {
            int estimatedHours = job.getEstimatedHours() != null ? job.getEstimatedHours() : 0;
            int actualHours = job.getActualHours() != null ? job.getActualHours() : 0;
            
            totalEstimatedHours += estimatedHours;
            totalActualHours += actualHours;
            
            // Labor cost calculation (assuming $50/hour rate)
            BigDecimal hourlyRate = new BigDecimal("50.00");
            BigDecimal jobLaborCost = hourlyRate.multiply(new BigDecimal(actualHours));
            totalLaborCost = totalLaborCost.add(jobLaborCost);
            
            // Hours by status
            String status = job.getStatus().toString();
            hoursByStatus.put(status, hoursByStatus.getOrDefault(status, 0) + actualHours);
            
            // Labor cost by customer
            if (job.getCustomer() != null) {
                String customerName = job.getCustomer().getName();
                laborCostByCustomer.put(customerName, 
                    laborCostByCustomer.getOrDefault(customerName, BigDecimal.ZERO).add(jobLaborCost));
            }
        }
        
        double efficiency = totalEstimatedHours > 0 ? (double) totalActualHours / totalEstimatedHours * 100 : 0;
        
        Map<String, Object> report = new HashMap<>();
        report.put("period", Map.of("startDate", startDate, "endDate", endDate));
        report.put("summary", Map.of(
            "totalEstimatedHours", totalEstimatedHours,
            "totalActualHours", totalActualHours,
            "efficiency", efficiency,
            "totalLaborCost", totalLaborCost,
            "averageHourlyRate", totalActualHours > 0 ? totalLaborCost.divide(new BigDecimal(totalActualHours), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO
        ));
        report.put("hoursByStatus", hoursByStatus);
        report.put("laborCostByCustomer", laborCostByCustomer);
        
        return report;
    }
    
    // Expenses Report
    public Map<String, Object> generateExpensesReport(LocalDate startDate, LocalDate endDate, Long userId) {
        List<Job> jobs = jobRepository.findByDateRangeAndUserId(startDate, endDate, userId);
        
        BigDecimal totalBillableExpenses = BigDecimal.ZERO;
        BigDecimal totalNonBillableExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> expensesByCategory = new HashMap<>();
        Map<String, BigDecimal> expensesBySupplier = new HashMap<>();
        
        for (Job job : jobs) {
            if (job.getSales() != null) {
                for (Sale sale : job.getSales()) {
                    if (sale.getSaleItems() != null) {
                        for (SaleItem item : sale.getSaleItems()) {
                            BigDecimal itemCost = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                            
                            // Determine if billable (positive quantity) or non-billable (negative quantity)
                            if (item.getQuantity() > 0) {
                                totalBillableExpenses = totalBillableExpenses.add(itemCost);
                            } else {
                                totalNonBillableExpenses = totalNonBillableExpenses.add(itemCost.abs());
                            }
                            
                            // Expenses by category (using product category if available)
                            String category = item.getProduct() != null ? 
                                (item.getProduct().getCategory() != null ? item.getProduct().getCategory() : "General") : "General";
                            expensesByCategory.put(category, 
                                expensesByCategory.getOrDefault(category, BigDecimal.ZERO).add(itemCost.abs()));
                            
                            // Expenses by supplier
                            if (sale.getSupplier() != null) {
                                String supplierName = sale.getSupplier().getName();
                                expensesBySupplier.put(supplierName, 
                                    expensesBySupplier.getOrDefault(supplierName, BigDecimal.ZERO).add(itemCost.abs()));
                            }
                        }
                    }
                }
            }
        }
        
        Map<String, Object> report = new HashMap<>();
        report.put("period", Map.of("startDate", startDate, "endDate", endDate));
        report.put("summary", Map.of(
            "totalBillableExpenses", totalBillableExpenses,
            "totalNonBillableExpenses", totalNonBillableExpenses,
            "totalExpenses", totalBillableExpenses.add(totalNonBillableExpenses),
            "billableRatio", totalBillableExpenses.add(totalNonBillableExpenses).compareTo(BigDecimal.ZERO) > 0 ? 
                totalBillableExpenses.divide(totalBillableExpenses.add(totalNonBillableExpenses), 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO
        ));
        report.put("expensesByCategory", expensesByCategory);
        report.put("expensesBySupplier", expensesBySupplier);
        
        return report;
    }
    
    // Business Insights Report
    public Map<String, Object> generateBusinessInsightsReport(LocalDate startDate, LocalDate endDate, Long userId) {
        List<Job> jobs = jobRepository.findByDateRangeAndUserId(startDate, endDate, userId);
        
        // Key metrics
        int totalJobs = jobs.size();
        int completedJobs = (int) jobs.stream().filter(j -> j.getStatus() == JobStatus.COMPLETED).count();
        int inProgressJobs = (int) jobs.stream().filter(j -> j.getStatus() == JobStatus.IN_PROGRESS).count();
        int pendingJobs = (int) jobs.stream().filter(j -> j.getStatus() == JobStatus.PENDING).count();
        
        // Revenue metrics
        BigDecimal totalRevenue = jobs.stream()
            .map(this::calculateJobRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Customer metrics - get unique customers from jobs (already filtered by userId through jobs)
        Map<Long, Long> customerJobCounts = jobs.stream()
            .filter(j -> j.getCustomer() != null)
            .collect(Collectors.groupingBy(j -> j.getCustomer().getId(), Collectors.counting()));
        
        int activeCustomers = customerJobCounts.size();
        // Total customers is the count of unique customers in the jobs for this user
        // This ensures data isolation - only customers associated with this user's jobs are counted
        int totalCustomers = activeCustomers;
        
        // Efficiency metrics
        int totalEstimatedHours = jobs.stream()
            .mapToInt(j -> j.getEstimatedHours() != null ? j.getEstimatedHours() : 0)
            .sum();
        int totalActualHours = jobs.stream()
            .mapToInt(j -> j.getActualHours() != null ? j.getActualHours() : 0)
            .sum();
        
        double efficiency = totalEstimatedHours > 0 ? (double) totalActualHours / totalEstimatedHours * 100 : 0;
        
        // Top customers by revenue
        Map<String, BigDecimal> topCustomers = jobs.stream()
            .filter(j -> j.getCustomer() != null)
            .collect(Collectors.groupingBy(
                j -> j.getCustomer().getName(),
                Collectors.reducing(BigDecimal.ZERO, this::calculateJobRevenue, BigDecimal::add)
            ))
            .entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .limit(5)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));
        
        Map<String, Object> report = new HashMap<>();
        report.put("period", Map.of("startDate", startDate, "endDate", endDate));
        report.put("overview", Map.of(
            "totalJobs", totalJobs,
            "completedJobs", completedJobs,
            "inProgressJobs", inProgressJobs,
            "pendingJobs", pendingJobs,
            "totalRevenue", totalRevenue,
            "activeCustomers", activeCustomers,
            "totalCustomers", totalCustomers
        ));
        report.put("efficiency", Map.of(
            "totalEstimatedHours", totalEstimatedHours,
            "totalActualHours", totalActualHours,
            "efficiency", efficiency
        ));
        report.put("topCustomers", topCustomers);
        
        return report;
    }
    
    // Helper methods
    private BigDecimal calculateJobRevenue(Job job) {
        if (job.getSales() == null) return BigDecimal.ZERO;
        
        return job.getSales().stream()
            .flatMap(sale -> sale.getSaleItems().stream())
            .filter(item -> item.getQuantity() > 0) // Only positive quantities (sales)
            .map(item -> item.getUnitPrice().multiply(new BigDecimal(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private BigDecimal calculateMaterialsCost(Job job) {
        if (job.getSales() == null) return BigDecimal.ZERO;
        
        return job.getSales().stream()
            .flatMap(sale -> sale.getSaleItems().stream())
            .filter(item -> item.getQuantity() > 0) // Only positive quantities (materials used)
            .map(item -> item.getUnitPrice().multiply(new BigDecimal(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private BigDecimal calculateLaborCost(Job job) {
        int actualHours = job.getActualHours() != null ? job.getActualHours() : 0;
        BigDecimal hourlyRate = new BigDecimal("50.00"); // Default hourly rate
        return hourlyRate.multiply(new BigDecimal(actualHours));
    }
}
