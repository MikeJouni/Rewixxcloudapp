package com.rewixxcloudapp.repository;

import com.rewixxcloudapp.entity.ScheduleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {
    List<ScheduleEvent> findByUserIdOrderByEventDateAsc(Long userId);
    Optional<ScheduleEvent> findByIdAndUserId(Long id, Long userId);
}
