package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.service.JobService;
import com.rewixxcloudapp.dto.JobDto;
import com.rewixxcloudapp.dto.MaterialDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    private static final Logger logger = LoggerFactory.getLogger(JobController.class);

    @Autowired
    private JobService jobService;

    @PostMapping("/create")
    public ResponseEntity<?> createJob(@RequestBody JobDto dto) {
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
            
            logger.info("Creating job with title: '{}' and customerId: {}", dto.getTitle(), dto.getCustomerId());
            Job job = jobService.createJob(dto);
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
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        try {
            Optional<Job> job = jobService.getJobById(id);
            return job.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting job by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(@PathVariable Long id, @RequestBody JobDto dto) {
        try {
            Optional<Job> jobOpt = jobService.getJobById(id);
            if (jobOpt.isPresent()) {
                Job updatedJob = jobService.updateJobFromDto(jobOpt.get(), dto);
                return ResponseEntity.ok(updatedJob);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating job: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        try {
            Optional<Job> jobOpt = jobService.getJobById(id);
            if (jobOpt.isPresent()) {
                jobService.deleteJobById(id);
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
    public ResponseEntity<?> getJobsList(@RequestBody Map<String, Object> request) {
        try {
            Integer pageSize = (Integer) request.getOrDefault("pageSize", 10);
            Integer page = (Integer) request.getOrDefault("page", 0);
            String searchTerm = (String) request.getOrDefault("searchTerm", "");
            String statusFilter = (String) request.getOrDefault("statusFilter", "All");
            if (pageSize < 1 || pageSize > 10000) {
                pageSize = 10;
            }
            if (page < 0) {
                page = 0;
            }
            Map<String, Object> result = jobService.getJobsList(page, pageSize, searchTerm, statusFilter);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting jobs list", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/materials")
    public ResponseEntity<?> addMaterialToJob(@PathVariable Long id, @RequestBody MaterialDto materialDto) {
        try {
            if (materialDto.getProductId() == null || materialDto.getQuantity() == null) {
                return ResponseEntity.badRequest().body("Product ID and quantity are required");
            }
            var sale = jobService.addMaterialToJob(id, materialDto);
            return ResponseEntity.ok(sale);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error adding material to job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error adding material to job: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}/materials/{materialId}")
    public ResponseEntity<?> removeMaterialFromJob(@PathVariable Long id, @PathVariable Long materialId) {
        try {
            jobService.removeMaterialFromJob(id, materialId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error removing material from job: {}", id, e);
            return ResponseEntity.internalServerError().body("Error removing material from job: " + e.getMessage());
        }
    }
}
