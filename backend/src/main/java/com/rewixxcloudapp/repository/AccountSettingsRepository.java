package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.AccountSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountSettingsRepository extends JpaRepository<AccountSettings, Long> {
    Optional<AccountSettings> findByUserId(Long userId);
}
