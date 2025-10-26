package com.rewixxcloudapp.dto;

import java.time.LocalDate;
import java.util.List;

public class JobDto {
    private String title;
    private String description;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long customerId;
    private List<String> receiptImageUrls;
    private Double jobPrice;
    private Double customMaterialCost;
    private Boolean includeTax;

    public JobDto() {
    }

    public JobDto(String title, String description, String status) {
        this.title = title;
        this.description = description;
        this.status = status;
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

    public Double getJobPrice() {
        return jobPrice;
    }

    public void setJobPrice(Double jobPrice) {
        this.jobPrice = jobPrice;
    }

    public Double getCustomMaterialCost() {
        return customMaterialCost;
    }

    public void setCustomMaterialCost(Double customMaterialCost) {
        this.customMaterialCost = customMaterialCost;
    }

    public Boolean getIncludeTax() {
        return includeTax;
    }

    public void setIncludeTax(Boolean includeTax) {
        this.includeTax = includeTax;
    }
}
