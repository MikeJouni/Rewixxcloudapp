package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.AccountSettingsDto;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.repository.AccountSettingsRepository;
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

    public AccountSettings getAccountSettings(Long userId) {
        logger.info("Fetching account settings for user {}", userId);
        Optional<AccountSettings> settingsOpt = accountSettingsRepository.findByUserId(userId);

        if (settingsOpt.isEmpty()) {
            // Create default settings if none exist
            logger.info("No account settings found for user {}, creating default", userId);
            AccountSettings defaultSettings = new AccountSettings("My Company");
            defaultSettings.setUserId(userId);
            return accountSettingsRepository.save(defaultSettings);
        }

        return settingsOpt.get();
    }

    public AccountSettings updateAccountSettings(AccountSettingsDto dto, Long userId) {
        logger.info("Updating account settings for user {}", userId);

        AccountSettings settings = getAccountSettings(userId);
        // Only override fields that are provided; keep existing values otherwise
        if (dto.getCompanyName() != null && !dto.getCompanyName().trim().isEmpty()) {
            settings.setCompanyName(dto.getCompanyName().trim());
        }
        if (dto.getEmail() != null) {
            settings.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            settings.setPhone(dto.getPhone());
        }
        if (dto.getAddress() != null) {
            settings.setAddress(dto.getAddress());
        }
        // logoUrl may legitimately be null (to clear the logo), so always set it
        settings.setLogoUrl(dto.getLogoUrl());

        AccountSettings savedSettings = accountSettingsRepository.save(settings);
        logger.info("Account settings updated successfully");
        return savedSettings;
    }
}
