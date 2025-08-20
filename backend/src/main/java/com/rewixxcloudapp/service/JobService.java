package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.JobStatus;
import com.rewixxcloudapp.entity.JobPriority;
import com.rewixxcloudapp.entity.Sale;
import com.rewixxcloudapp.entity.SaleItem;
import com.rewixxcloudapp.entity.Product;
import com.rewixxcloudapp.repository.JobRepository;
import com.rewixxcloudapp.repository.CustomerRepository;
import com.rewixxcloudapp.repository.ProductRepository;
import com.rewixxcloudapp.dto.JobDto;
import com.rewixxcloudapp.dto.MaterialDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class JobService {

    private static final Logger logger = LoggerFactory.getLogger(JobService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    public Optional<Job> getJobById(Long id) {
        return jobRepository.findById(id);
    }

    public Job saveJob(Job job) {
        return jobRepository.save(job);
    }

    public Job createJob(JobDto dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }

        logger.info("Creating job with data: title={}, customerId={}, status={}, priority={}", 
                   dto.getTitle(), dto.getCustomerId(), dto.getStatus(), dto.getPriority());

        Job job = new Job();
        job.setTitle(dto.getTitle());
        job.setDescription(dto.getDescription() != null ? dto.getDescription() : "");
        
        // Set status and priority with defaults if not provided
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                job.setStatus(JobStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid status provided: {}, using default PENDING", dto.getStatus());
                job.setStatus(JobStatus.PENDING);
            }
        } else {
            job.setStatus(JobStatus.PENDING);
        }

        if (dto.getPriority() != null && !dto.getPriority().trim().isEmpty()) {
            try {
                job.setPriority(JobPriority.valueOf(dto.getPriority().toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid priority provided: {}, using default MEDIUM", dto.getPriority());
                job.setPriority(JobPriority.MEDIUM);
            }
        } else {
            job.setPriority(JobPriority.MEDIUM);
        }

        // Handle dates - convert from string to LocalDate if needed
        if (dto.getStartDate() != null) {
            job.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            job.setEndDate(dto.getEndDate());
        }

        // Set receipt image URLs if provided
        if (dto.getReceiptImageUrls() != null) {
            job.setReceiptImageUrls(dto.getReceiptImageUrls());
        }

        // Set customer if provided
        if (dto.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findById(dto.getCustomerId());
            if (customer.isPresent()) {
                job.setCustomer(customer.get());
                logger.info("Customer found and set: {}", customer.get().getUsername());
            } else {
                logger.warn("Customer with ID {} not found, setting customer to null", dto.getCustomerId());
                job.setCustomer(null);
            }
        } else {
            logger.warn("No customer ID provided, setting customer to null");
            job.setCustomer(null);
        }

        logger.info("Saving job to database...");
        Job savedJob = jobRepository.save(job);
        logger.info("Job saved successfully with ID: {}", savedJob.getId());
        return savedJob;
    }

    public Job updateJobFromDto(Job job, JobDto dto) {
        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            job.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            job.setDescription(dto.getDescription());
        }
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                job.setStatus(JobStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid status provided: {}", dto.getStatus());
            }
        }
        if (dto.getPriority() != null && !dto.getPriority().trim().isEmpty()) {
            try {
                job.setPriority(JobPriority.valueOf(dto.getPriority().toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid priority provided: {}", dto.getPriority());
            }
        }
        if (dto.getStartDate() != null) {
            job.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            job.setEndDate(dto.getEndDate());
        }
        if (dto.getReceiptImageUrls() != null) {
            job.setReceiptImageUrls(dto.getReceiptImageUrls());
        }
        // Remove estimated hours since it's no longer needed
        // if (dto.getEstimatedHours() != null) {
        //     job.setEstimatedHours(dto.getEstimatedHours());
        // }
        if (dto.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findById(dto.getCustomerId());
            if (customer.isPresent()) {
                job.setCustomer(customer.get());
            }
        }
        return jobRepository.save(job);
    }

    public void deleteJobById(Long id) {
        jobRepository.deleteById(id);
    }

    public Map<String, Object> getJobsList(int page, int pageSize, String searchTerm, String statusFilter) {
        List<Job> jobs = jobRepository.findJobsWithSearch(searchTerm, statusFilter, page, pageSize);
        long totalJobs = jobRepository.countJobsWithSearch(searchTerm, statusFilter);
        int totalPages = (int) Math.ceil((double) totalJobs / pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("jobs", jobs);
        result.put("totalJobs", totalJobs);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);
        result.put("pageSize", pageSize);
        result.put("hasNext", page < totalPages - 1);
        result.put("hasPrevious", page > 0);

        return result;
    }

    public Sale addMaterialToJob(Long jobId, MaterialDto materialDto) {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (!jobOpt.isPresent()) {
            throw new IllegalArgumentException("Job not found");
        }

        Optional<Product> productOpt = productRepository.findById(materialDto.getProductId());
        if (!productOpt.isPresent()) {
            throw new IllegalArgumentException("Product not found");
        }

        Job job = jobOpt.get();
        Product product = productOpt.get();

        // Create a new sale for this material addition
        Sale sale = new Sale();
        sale.setDate(java.time.LocalDateTime.now());
        sale.setDescription("Material added to job: " + job.getTitle());
        sale.setJob(job);
        sale.setCustomer(job.getCustomer());

        // Create sale item for the material
        SaleItem saleItem = new SaleItem();
        saleItem.setSale(sale);
        saleItem.setProduct(product);
        saleItem.setQuantity(materialDto.getQuantity());
        saleItem.setUnitPrice(materialDto.getUnitPrice() != null ? materialDto.getUnitPrice() : product.getUnitPrice());

        // Set the sale items
        sale.setSaleItems(java.util.Collections.singleton(saleItem));

        // Add the sale to the job's sales list
        if (job.getSales() == null) {
            job.setSales(new java.util.ArrayList<>());
        }
        job.getSales().add(sale);

        // Save the job (this will cascade to save the sale and sale item)
        jobRepository.save(job);
        
        return sale;
    }

    public void removeMaterialFromJob(Long jobId, Long materialId) {
        logger.info("Removing material {} from job {}", materialId, jobId);
        
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (!jobOpt.isPresent()) {
            logger.error("Job not found with ID: {}", jobId);
            throw new IllegalArgumentException("Job not found");
        }

        Job job = jobOpt.get();
        logger.info("Found job: {} with {} sales", job.getTitle(), job.getSales() != null ? job.getSales().size() : 0);
        
        // Find and remove the sale that contains the material
        if (job.getSales() != null) {
            // Find sales to remove
            List<Sale> salesToRemove = new ArrayList<>();
            
            for (Sale sale : job.getSales()) {
                if (sale.getSaleItems() != null) {
                    for (SaleItem item : sale.getSaleItems()) {
                        if (item.getProduct() != null && item.getProduct().getId().equals(materialId)) {
                            salesToRemove.add(sale);
                            logger.info("Found sale to remove with product ID: {}", materialId);
                            break;
                        }
                    }
                }
            }
            
            logger.info("Found {} sales to remove", salesToRemove.size());
            
            // Remove each sale individually to trigger proper JPA cascade
            for (Sale saleToRemove : salesToRemove) {
                job.getSales().remove(saleToRemove);
                logger.info("Removed sale with ID: {}", saleToRemove.getId());
            }
            
            // Save the updated job
            jobRepository.save(job);
            logger.info("Job updated successfully, new sales count: {}", job.getSales().size());
        } else {
            logger.warn("Job has no sales to remove from");
        }
    }
}
