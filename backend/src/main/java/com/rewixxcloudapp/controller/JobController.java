package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.Sale;
import com.rewixxcloudapp.service.JobService;
import com.rewixxcloudapp.dto.JobDto;
import com.rewixxcloudapp.dto.MaterialDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    private static final Logger logger = LoggerFactory.getLogger(JobController.class);

    @Autowired
    private JobService jobService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        return null;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createJob(@RequestBody JobDto dto, HttpServletRequest request) {
        try {
            logger.info("Received job creation request: {}", dto);
            
            if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
                logger.warn("Job creation failed: Title is required");
                return ResponseEntity.badRequest().body("Title is required");
            }
            
            if (dto.getCustomerId() == null) {
                logger.warn("Job creation failed: Customer ID is required");
                return ResponseEntity.badRequest().body("Customer ID is required");
            }
            
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            logger.info("Creating job with title: '{}' and customerId: {} for user {}", dto.getTitle(), dto.getCustomerId(), userId);
            Job job = jobService.createJob(dto, userId);
            logger.info("Job created successfully with ID: {}", job.getId());
            return ResponseEntity.ok(job);
        } catch (IllegalArgumentException e) {
            logger.error("Job creation failed with IllegalArgumentException: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating job", e);
            return ResponseEntity.internalServerError().body("Error creating job: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getJobById(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            Optional<Job> job = jobService.getJobById(id, userId);
            return job.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting job by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable Long id, @RequestBody JobDto dto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            logger.info("Received update request for job ID: {} with data: title={}, description={}, jobPrice={}, status={}", 
                       id, dto.getTitle(), dto.getDescription(), dto.getJobPrice(), dto.getStatus());
            
            Optional<Job> jobOpt = jobService.getJobById(id, userId);
            if (jobOpt.isPresent()) {
                Job existing = jobOpt.get();
                logger.info("Found existing job: {}", existing.getId());
                // Allow editing jobs regardless of status
                Job updatedJob = jobService.updateJobFromDto(existing, dto);
                logger.info("Job updated successfully: {}", updatedJob.getId());
                return ResponseEntity.ok(updatedJob);
            } else {
                logger.warn("Job not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument when updating job {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error updating job: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            Optional<Job> jobOpt = jobService.getJobById(id, userId);
            if (jobOpt.isPresent()) {
                jobService.deleteJobById(id, userId);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error deleting job: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getJobsList(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            Integer pageSize = (Integer) requestBody.getOrDefault("pageSize", 10);
            Integer page = (Integer) requestBody.getOrDefault("page", 0);
            String searchTerm = (String) requestBody.getOrDefault("searchTerm", "");
            String statusFilter = (String) requestBody.getOrDefault("statusFilter", "All");
            if (pageSize < 1 || pageSize > 10000) {
                pageSize = 10;
            }
            if (page < 0) {
                page = 0;
            }
            Map<String, Object> result = jobService.getJobsList(page, pageSize, searchTerm, statusFilter, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting jobs list", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/materials")
    public ResponseEntity<?> addMaterialToJob(@PathVariable Long id, @RequestBody MaterialDto materialDto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            if (materialDto.getProductId() == null || materialDto.getQuantity() == null) {
                return ResponseEntity.badRequest().body("Product ID and quantity are required");
            }
            var sale = jobService.addMaterialToJob(id, materialDto, userId);
            return ResponseEntity.ok(sale);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error adding material to job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error adding material to job: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}/materials/{materialId}")
    public ResponseEntity<?> removeMaterialFromJob(@PathVariable Long id, @PathVariable Long materialId, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            jobService.removeMaterialFromJob(id, materialId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error removing material from job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error removing material from job: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/materials/{saleId}")
    public ResponseEntity<?> updateMaterialInJob(@PathVariable Long id, @PathVariable Long saleId, @RequestBody MaterialDto materialDto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            logger.info("Received update request for material in job ID: {} with saleId: {}, quantity: {}",
                       id, saleId, materialDto.getQuantity());

            if (materialDto.getQuantity() == null || materialDto.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body("Quantity must be greater than 0");
            }

            Sale updatedSale = jobService.updateMaterialInJob(id, saleId, materialDto, userId);
            logger.info("Material updated successfully in job: {}", id);
            return ResponseEntity.ok(updatedSale);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument when updating material in job {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating material in job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error updating material: " + e.getMessage());
        }
    }
}
