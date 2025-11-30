package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.JobStatus;
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

    public Optional<Job> getJobById(Long id, Long userId) {
        return jobRepository.findByIdAndUserId(id, userId);
    }

    public Job saveJob(Job job) {
        return jobRepository.save(job);
    }

    public Job createJob(JobDto dto, Long userId) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }

        logger.info("Creating job with data: title={}, customerId={}, status={}", 
                   dto.getTitle(), dto.getCustomerId(), dto.getStatus());

        Job job = new Job();
        job.setUserId(userId);
        job.setTitle(dto.getTitle());
        job.setDescription(dto.getDescription() != null ? dto.getDescription() : "");
        
        // Set work site address if provided
        if (dto.getWorkSiteAddress() != null) {
            job.setWorkSiteAddress(dto.getWorkSiteAddress());
        }
        
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

        // Set job price if provided
        if (dto.getJobPrice() != null) {
            job.setJobPrice(dto.getJobPrice());
        }

        // Set custom material cost if provided
        if (dto.getCustomMaterialCost() != null) {
            job.setCustomMaterialCost(dto.getCustomMaterialCost());
        }

        // Set include tax if provided
        if (dto.getIncludeTax() != null) {
            job.setIncludeTax(dto.getIncludeTax());
        }

        // Set customer if provided - verify it belongs to the user
        if (dto.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findByIdAndUserId(dto.getCustomerId(), userId);
            if (customer.isPresent()) {
                job.setCustomer(customer.get());
                logger.info("Customer found and set: {}", customer.get().getUsername());
            } else {
                logger.warn("Customer with ID {} not found for user {}, setting customer to null", dto.getCustomerId(), userId);
                throw new IllegalArgumentException("Customer not found or does not belong to you");
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
        logger.info("Updating job {} with DTO: title={}, description={}, jobPrice={}, customMaterialCost={}, includeTax={}, status={}", 
                   job.getId(), dto.getTitle(), dto.getDescription(), dto.getJobPrice(), dto.getCustomMaterialCost(), dto.getIncludeTax(), dto.getStatus());
        
        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            logger.info("Setting title to: {}", dto.getTitle());
            job.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            logger.info("Setting description to: {}", dto.getDescription());
            job.setDescription(dto.getDescription());
        }
        if (dto.getWorkSiteAddress() != null) {
            logger.info("Setting work site address to: {}", dto.getWorkSiteAddress());
            job.setWorkSiteAddress(dto.getWorkSiteAddress());
        }
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                logger.info("Setting status to: {}", dto.getStatus());
                job.setStatus(JobStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid status provided: {}", dto.getStatus());
            }
        }
        if (dto.getStartDate() != null) {
            logger.info("Setting start date to: {}", dto.getStartDate());
            job.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            logger.info("Setting end date to: {}", dto.getEndDate());
            job.setEndDate(dto.getEndDate());
        }
        if (dto.getReceiptImageUrls() != null) {
            logger.info("Setting receipt image URLs");
            job.setReceiptImageUrls(dto.getReceiptImageUrls());
        }
        if (dto.getJobPrice() != null) {
            logger.info("Setting job price to: {}", dto.getJobPrice());
            job.setJobPrice(dto.getJobPrice());
        }
        if (dto.getCustomMaterialCost() != null) {
            logger.info("Setting custom material cost to: {}", dto.getCustomMaterialCost());
            job.setCustomMaterialCost(dto.getCustomMaterialCost());
        }
        if (dto.getIncludeTax() != null) {
            logger.info("Setting include tax to: {}", dto.getIncludeTax());
            job.setIncludeTax(dto.getIncludeTax());
        }
        // Remove estimated hours since it's no longer needed
        // if (dto.getEstimatedHours() != null) {
        //     job.setEstimatedHours(dto.getEstimatedHours());
        // }
        if (dto.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findByIdAndUserId(dto.getCustomerId(), job.getUserId());
            if (customer.isPresent()) {
                logger.info("Setting customer to: {}", customer.get().getUsername());
                job.setCustomer(customer.get());
            } else {
                logger.warn("Customer with ID {} not found for user {}, cannot update customer", dto.getCustomerId(), job.getUserId());
                throw new IllegalArgumentException("Customer not found or does not belong to you");
            }
        }
        
        logger.info("Saving job to database...");
        Job savedJob = jobRepository.save(job);
        logger.info("Job saved successfully with ID: {}", savedJob.getId());
        return savedJob;
    }

    public void deleteJobById(Long id, Long userId) {
        Optional<Job> jobOpt = jobRepository.findByIdAndUserId(id, userId);
        if (jobOpt.isEmpty()) {
            throw new IllegalArgumentException("Job not found");
        }
        jobRepository.deleteById(id);
    }

    public Map<String, Object> getJobsList(int page, int pageSize, String searchTerm, String statusFilter, Long userId) {
        List<Job> jobs = jobRepository.findJobsWithSearch(searchTerm, statusFilter, page, pageSize, userId);
        long totalJobs = jobRepository.countJobsWithSearch(searchTerm, statusFilter, userId);
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

    public Sale addMaterialToJob(Long jobId, MaterialDto materialDto, Long userId) {
        Optional<Job> jobOpt = jobRepository.findByIdAndUserId(jobId, userId);
        if (!jobOpt.isPresent()) {
            throw new IllegalArgumentException("Job not found or does not belong to you");
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
        Job savedJob = jobRepository.save(job);

        // Find and return the persisted sale with its ID populated
        // The saved sale will be the last one in the list
        Sale savedSale = savedJob.getSales().get(savedJob.getSales().size() - 1);
        logger.info("Material added successfully. Sale ID: {}, SaleItem ID: {}",
                   savedSale.getId(),
                   savedSale.getSaleItems().isEmpty() ? "N/A" : savedSale.getSaleItems().iterator().next().getId());

        return savedSale;
    }

    public void removeMaterialFromJob(Long jobId, Long saleId, Long userId) {
        logger.info("Removing sale {} from job {} for user {}", saleId, jobId, userId);
        
        Optional<Job> jobOpt = jobRepository.findByIdAndUserId(jobId, userId);
        if (!jobOpt.isPresent()) {
            logger.error("Job not found with ID: {} for user {}", jobId, userId);
            throw new IllegalArgumentException("Job not found or does not belong to you");
        }

        Job job = jobOpt.get();
        logger.info("Found job: {} with {} sales", job.getTitle(), job.getSales() != null ? job.getSales().size() : 0);
        
        // Find and remove the specific sale by ID
        if (job.getSales() != null) {
            Sale saleToRemove = null;
            
            for (Sale sale : job.getSales()) {
                if (sale.getId().equals(saleId)) {
                    saleToRemove = sale;
                    logger.info("Found sale to remove with ID: {}", saleId);
                    break;
                }
            }
            
            if (saleToRemove != null) {
                job.getSales().remove(saleToRemove);
                logger.info("Removed sale with ID: {}", saleToRemove.getId());
                
                // Save the updated job
                jobRepository.save(job);
                logger.info("Job updated successfully, new sales count: {}", job.getSales().size());
            } else {
                logger.warn("Sale with ID {} not found in job {}", saleId, jobId);
                throw new IllegalArgumentException("Sale not found in this job");
            }
        } else {
            logger.warn("Job has no sales to remove from");
            throw new IllegalArgumentException("Job has no sales");
        }
    }

    public Sale updateMaterialInJob(Long jobId, Long saleId, MaterialDto materialDto, Long userId) {
        logger.info("Updating sale {} in job {} with new quantity: {} for user {}", saleId, jobId, materialDto.getQuantity(), userId);

        Optional<Job> jobOpt = jobRepository.findByIdAndUserId(jobId, userId);
        if (!jobOpt.isPresent()) {
            logger.error("Job not found with ID: {} for user {}", jobId, userId);
            throw new IllegalArgumentException("Job not found or does not belong to you");
        }

        Job job = jobOpt.get();
        logger.info("Found job: {} with {} sales", job.getTitle(), job.getSales() != null ? job.getSales().size() : 0);

        // Find the specific sale by ID
        if (job.getSales() != null) {
            Sale saleToUpdate = null;

            for (Sale sale : job.getSales()) {
                if (sale.getId().equals(saleId)) {
                    saleToUpdate = sale;
                    logger.info("Found sale to update with ID: {}", saleId);
                    break;
                }
            }

            if (saleToUpdate != null) {
                // Update the quantity in the first sale item (materials are stored as sale items)
                if (saleToUpdate.getSaleItems() != null && !saleToUpdate.getSaleItems().isEmpty()) {
                    SaleItem saleItem = saleToUpdate.getSaleItems().iterator().next();
                    logger.info("Updating sale item quantity from {} to {}", saleItem.getQuantity(), materialDto.getQuantity());
                    saleItem.setQuantity(materialDto.getQuantity());

                    // Update unit price if provided
                    if (materialDto.getUnitPrice() != null) {
                        logger.info("Updating unit price from {} to {}", saleItem.getUnitPrice(), materialDto.getUnitPrice());
                        saleItem.setUnitPrice(materialDto.getUnitPrice());
                    }

                    // Save the updated job (cascades to sale and sale items)
                    jobRepository.save(job);
                    logger.info("Sale updated successfully in job: {}", jobId);
                    return saleToUpdate;
                } else {
                    logger.error("Sale has no sale items to update");
                    throw new IllegalArgumentException("Sale has no items");
                }
            } else {
                logger.warn("Sale with ID {} not found in job {}", saleId, jobId);
                throw new IllegalArgumentException("Sale not found in this job");
            }
        } else {
            logger.warn("Job has no sales to update");
            throw new IllegalArgumentException("Job has no sales");
        }
    }
}
