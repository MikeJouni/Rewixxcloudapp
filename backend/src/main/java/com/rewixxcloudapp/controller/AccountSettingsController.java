package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.dto.AccountSettingsDto;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.service.AccountSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/account-settings")
@CrossOrigin(origins = "*")
public class AccountSettingsController {

    private static final Logger logger = LoggerFactory.getLogger(AccountSettingsController.class);

    @Autowired
    private AccountSettingsService accountSettingsService;

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

    @GetMapping
    public ResponseEntity<?> getAccountSettings(HttpServletRequest request) {
        logger.info("=== GET ACCOUNT SETTINGS ===");
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                logger.warn("✗ No userId found in token");
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            logger.info("✓ Extracted userId from token: {}", userId);
            logger.info("Fetching account settings for userId: {}", userId);
            AccountSettings settings = accountSettingsService.getAccountSettings(userId);
            logger.info("✓ Found account settings:");
            logger.info("  - userId: {}", settings.getUserId());
            logger.info("  - companyName: {}", settings.getCompanyName());
            logger.info("  - email: {}", settings.getEmail());
            logger.info("=== END GET ACCOUNT SETTINGS ===");
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("✗ Error fetching account settings", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping
    public ResponseEntity<?> updateAccountSettings(@RequestBody AccountSettingsDto dto, HttpServletRequest request) {
        logger.info("PUT /api/account-settings - Updating account settings");
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            AccountSettings updatedSettings = accountSettingsService.updateAccountSettings(dto, userId);
            return ResponseEntity.ok(updatedSettings);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid account settings data: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating account settings", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
