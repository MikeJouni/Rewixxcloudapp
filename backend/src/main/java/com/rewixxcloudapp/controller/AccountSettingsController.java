package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.dto.AccountSettingsDto;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.service.AccountSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account-settings")
@CrossOrigin(origins = "*")
public class AccountSettingsController {

    private static final Logger logger = LoggerFactory.getLogger(AccountSettingsController.class);

    @Autowired
    private AccountSettingsService accountSettingsService;

    @GetMapping
    public ResponseEntity<AccountSettings> getAccountSettings() {
        logger.info("GET /api/account-settings - Fetching account settings");
        try {
            AccountSettings settings = accountSettingsService.getAccountSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Error fetching account settings", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping
    public ResponseEntity<AccountSettings> updateAccountSettings(@RequestBody AccountSettingsDto dto) {
        logger.info("PUT /api/account-settings - Updating account settings");
        try {
            AccountSettings updatedSettings = accountSettingsService.updateAccountSettings(dto);
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
