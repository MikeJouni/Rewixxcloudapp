package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.AccountSettingsDto;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.repository.AccountSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(AccountSettingsService.class);

    @Autowired
    private AccountSettingsRepository accountSettingsRepository;

    public AccountSettings getAccountSettings() {
        logger.info("Fetching account settings");
        List<AccountSettings> settings = accountSettingsRepository.findAll();

        if (settings.isEmpty()) {
            // Create default settings if none exist
            logger.info("No account settings found, creating default");
            AccountSettings defaultSettings = new AccountSettings("Imad's Electrical LLC");
            return accountSettingsRepository.save(defaultSettings);
        }

        return settings.get(0); // Return the first (and should be only) settings record
    }

    public AccountSettings updateAccountSettings(AccountSettingsDto dto) {
        logger.info("Updating account settings");

        if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }

        AccountSettings settings = getAccountSettings();
        settings.setCompanyName(dto.getCompanyName());
        settings.setEmail(dto.getEmail());
        settings.setPhone(dto.getPhone());
        settings.setAddress(dto.getAddress());

        AccountSettings savedSettings = accountSettingsRepository.save(settings);
        logger.info("Account settings updated successfully");
        return savedSettings;
    }
}
