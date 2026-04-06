package com.rewixxcloudapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "schedule_events")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ScheduleEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate eventDate;

    private String eventTime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String color;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
    }

    public ScheduleEvent() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

    public String getEventTime() { return eventTime; }
    public void setEventTime(String eventTime) { this.eventTime = eventTime; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
