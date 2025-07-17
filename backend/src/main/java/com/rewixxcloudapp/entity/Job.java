package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;

import javax.persistence.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Collection;

@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Enumerated(EnumType.STRING)
    private JobPriority priority;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer estimatedHours;

    @ManyToOne
    private Customer customer;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL)
    private List<Sale> sales;

    @ElementCollection
    @CollectionTable(name = "job_receipt_images", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "image_url")
    private List<String> receiptImageUrls;

    public Job() {
    }

    public Job(String title, String description, JobStatus status, JobPriority priority) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "title", "description", "status", "priority", "startDate", "endDate",
                        "estimatedHours", "receiptImageUrls", "customer.id", "customer.username",
                        "customer.phone", "customer.addressLine1", "customer.city", "customer.state")
                .exclude("*");
    }

    public String toJson() {
        return Job.serializer().serialize(this);
    }

    public static String toJsonArray(Collection<Job> jobs) {
        return JsonSerializer.toJsonArray(jobs, Job.serializer());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public JobPriority getPriority() {
        return priority;
    }

    public void setPriority(JobPriority priority) {
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

    public Integer getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(Integer estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public List<Sale> getSales() {
        return sales;
    }

    public void setSales(List<Sale> sales) {
        this.sales = sales;
    }

    public List<String> getReceiptImageUrls() {
        return receiptImageUrls;
    }

    public void setReceiptImageUrls(List<String> receiptImageUrls) {
        this.receiptImageUrls = receiptImageUrls;
    }
}