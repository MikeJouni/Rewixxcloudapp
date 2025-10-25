package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import javax.persistence.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Collection;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer estimatedHours;
    
    private Integer actualHours;

    private Double jobPrice;

    @ManyToOne
    private Customer customer;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL)
    @JsonManagedReference("job-sales")
    private List<Sale> sales;

    @ElementCollection
    @CollectionTable(name = "job_receipt_images", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> receiptImageUrls;

    public Job() {
    }

    public Job(String title, String description, JobStatus status) {
        this.title = title;
        this.description = description;
        this.status = status;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "title", "description", "status", "startDate", "endDate",
                        "jobPrice", "receiptImageUrls", "customer.id", "customer.username",
                        "customer.phone", "customer.addressLine1", "customer.city", "customer.state",
                        "sales.id", "sales.date", "sales.description", "sales.saleItems.id", 
                        "sales.saleItems.quantity", "sales.saleItems.unitPrice", 
                        "sales.saleItems.product.id", "sales.saleItems.product.name", 
                        "sales.saleItems.product.unitPrice", "sales.saleItems.product.category",
                        "sales.saleItems.product.description")
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
    
    public Integer getActualHours() {
        return actualHours;
    }

    public void setActualHours(Integer actualHours) {
        this.actualHours = actualHours;
    }

    public Double getJobPrice() {
        return jobPrice;
    }

    public void setJobPrice(Double jobPrice) {
        this.jobPrice = jobPrice;
    }
}