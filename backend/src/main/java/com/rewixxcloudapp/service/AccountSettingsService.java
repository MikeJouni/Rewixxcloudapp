package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.AccountSettingsDto;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.entity.AuthUser;
import com.rewixxcloudapp.repository.AccountSettingsRepository;
import com.rewixxcloudapp.repository.AuthUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(AccountSettingsService.class);

    @Autowired
    private AccountSettingsRepository accountSettingsRepository;

    @Autowired
    private AuthUserRepository authUserRepository;

    public AccountSettings getAccountSettings(Long userId) {
        logger.info("Fetching account settings for user {}", userId);
        
        // First, get the authenticated user's email to ensure sync
        Optional<AuthUser> authUserOpt = authUserRepository.findById(userId);
        if (authUserOpt.isEmpty()) {
            logger.error("User {} not found in auth_users table", userId);
            throw new RuntimeException("User not found");
        }
        AuthUser authUser = authUserOpt.get();
        String userEmail = authUser.getEmail();
        
        Optional<AccountSettings> settingsOpt = accountSettingsRepository.findByUserId(userId);

        AccountSettings settings;
        if (settingsOpt.isEmpty()) {
            // Create default settings if none exist
            logger.info("No account settings found for user {}, creating default", userId);
            settings = new AccountSettings("My Company");
            settings.setUserId(userId);
            settings.setEmail(userEmail); // Always use authenticated user's email
            settings = accountSettingsRepository.save(settings);
        } else {
            settings = settingsOpt.get();
            // CRITICAL: Always sync email with authenticated user's email
            if (!userEmail.equals(settings.getEmail())) {
                logger.warn("Account settings email ({}) doesn't match authenticated user email ({}). Syncing...", 
                    settings.getEmail(), userEmail);
                settings.setEmail(userEmail);
                settings = accountSettingsRepository.save(settings);
            }
        }

        return settings;
    }

    public AccountSettings updateAccountSettings(AccountSettingsDto dto, Long userId) {
        logger.info("Updating account settings for user {}", userId);

        // Get authenticated user's email to ensure email field stays in sync
        Optional<AuthUser> authUserOpt = authUserRepository.findById(userId);
        if (authUserOpt.isEmpty()) {
            logger.error("User {} not found in auth_users table", userId);
            throw new RuntimeException("User not found");
        }
        String userEmail = authUserOpt.get().getEmail();

        AccountSettings settings = getAccountSettings(userId);
        // Only override fields that are provided; keep existing values otherwise
        if (dto.getCompanyName() != null && !dto.getCompanyName().trim().isEmpty()) {
            settings.setCompanyName(dto.getCompanyName().trim());
        }
        // CRITICAL: Email should always match authenticated user's email - ignore any email in DTO
        // The email field in account settings is read-only and always synced with AuthUser
        settings.setEmail(userEmail);
        if (dto.getPhone() != null) {
            settings.setPhone(dto.getPhone());
        }
        if (dto.getAddress() != null) {
            settings.setAddress(dto.getAddress());
        }
        // logoUrl may legitimately be null (to clear the logo), so always set it
        settings.setLogoUrl(dto.getLogoUrl());

        AccountSettings savedSettings = accountSettingsRepository.save(settings);
        logger.info("Account settings updated successfully for user {} - email synced to: {}", userId, userEmail);
        return savedSettings;
    }
}
