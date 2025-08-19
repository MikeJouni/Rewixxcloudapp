package com.rewixxcloudapp.dto;

import java.time.LocalDate;
import java.util.List;

public class JobDto {
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long customerId;
    private List<String> receiptImageUrls;

    public JobDto() {
    }

    public JobDto(String title, String description, String status, String priority) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public List<String> getReceiptImageUrls() {
        return receiptImageUrls;
    }

    public void setReceiptImageUrls(List<String> receiptImageUrls) {
        this.receiptImageUrls = receiptImageUrls;
    }
}
