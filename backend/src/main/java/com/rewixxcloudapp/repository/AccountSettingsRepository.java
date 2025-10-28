package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.AccountSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountSettingsRepository extends JpaRepository<AccountSettings, Long> {
}
