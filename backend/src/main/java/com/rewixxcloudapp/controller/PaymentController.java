package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.dto.PaymentDto;
import com.rewixxcloudapp.entity.Payment;
import com.rewixxcloudapp.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

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

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getPaymentsByJobId(@PathVariable Long jobId, HttpServletRequest request) {
        logger.info("GET /api/payments/job/{} - Fetching payments for job", jobId);
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Unauthorized"));
            }
            List<Payment> payments = paymentService.getPaymentsByJobId(jobId, userId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("Error fetching payments for job ID: {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching payments: " + e.getMessage()));
        }
    }

    @GetMapping("/job/{jobId}/total")
    public ResponseEntity<?> getTotalPaidByJobId(@PathVariable Long jobId, HttpServletRequest request) {
        logger.info("GET /api/payments/job/{}/total - Calculating total paid", jobId);
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Unauthorized"));
            }
            BigDecimal total = paymentService.getTotalPaidByJobId(jobId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("jobId", jobId);
            response.put("totalPaid", total);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error calculating total paid for job ID: {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error calculating total: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody PaymentDto paymentDto, HttpServletRequest request) {
        logger.info("POST /api/payments - Creating payment for job ID: {}", paymentDto.getJobId());
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Unauthorized"));
            }
            Payment payment = paymentService.createPayment(paymentDto, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error creating payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error creating payment: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id, HttpServletRequest request) {
        logger.info("DELETE /api/payments/{}", id);
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Unauthorized"));
            }
            paymentService.deletePayment(id, userId);
            return ResponseEntity.ok(createSuccessResponse("Payment deleted successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Error deleting payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting payment ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error deleting payment: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return response;
    }

    private Map<String, String> createSuccessResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}
