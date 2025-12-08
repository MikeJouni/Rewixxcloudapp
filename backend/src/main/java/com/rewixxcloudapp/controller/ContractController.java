package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.dto.ContractDto;
import com.rewixxcloudapp.entity.Contract;
import com.rewixxcloudapp.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "*")
public class ContractController {

    private static final Logger logger = LoggerFactory.getLogger(ContractController.class);

    @Autowired
    private ContractService contractService;

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
    public ResponseEntity<?> createContract(@RequestBody ContractDto dto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            logger.info("Creating contract for user: {}", userId);

            if (dto.getCustomerName() == null || dto.getCustomerName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Customer name is required"));
            }

            if (dto.getScopeOfWork() == null || dto.getScopeOfWork().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Scope of work is required"));
            }

            if (dto.getTotalPrice() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Total price is required"));
            }

            Contract contract = contractService.createContract(dto, userId);
            logger.info("Contract created successfully with ID: {}", contract.getId());
            return ResponseEntity.ok(contract);
        } catch (Exception e) {
            logger.error("Error creating contract", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error creating contract: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContractById(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            Optional<Contract> contract = contractService.getContractById(id, userId);
            return contract.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting contract by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/list")
    public ResponseEntity<?> getContractsList(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            Integer pageSize = (Integer) requestBody.getOrDefault("pageSize", 10);
            Integer page = (Integer) requestBody.getOrDefault("page", 0);
            String searchTerm = (String) requestBody.getOrDefault("searchTerm", "");

            if (pageSize < 1 || pageSize > 10000) {
                pageSize = 10;
            }
            if (page < 0) {
                page = 0;
            }

            Map<String, Object> result = contractService.getContractsList(page, pageSize, searchTerm, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting contracts list", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateContract(@PathVariable Long id, @RequestBody ContractDto dto, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            Contract contract = contractService.updateContract(id, dto, userId);
            return ResponseEntity.ok(contract);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating contract: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error updating contract: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContract(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            contractService.deleteContract(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting contract: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/by-job/{jobId}")
    public ResponseEntity<?> getContractByJobId(@PathVariable Long jobId, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            Optional<Contract> contract = contractService.getContractByJobId(jobId, userId);
            return contract.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting contract by job id: {}", jobId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
