package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "sales")
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;

    private String description;

    @ManyToOne
    private Customer customer;

    @ManyToOne
    private Supplier supplier;

    @ManyToOne
    private Job job;

    @OneToMany(mappedBy = "sale")
    private List<Tender> tenders;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
    private Set<SaleItem> saleItems;

    public Sale() {
    }

    public Sale(LocalDateTime date, String description) {
        this.date = date;
        this.description = description;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "date", "description", "customer.id", "customer.username",
                        "supplier.id", "supplier.username", "job.id", "job.title",
                        "saleItems.id", "saleItems.quantity", "saleItems.unitPrice",
                        "saleItems.product.id", "saleItems.product.name")
                .exclude("*");
    }

    public String toJson() {
        return Sale.serializer().serialize(this);
    }

    public static String toJsonArray(List<Sale> sales) {
        return JsonSerializer.toJsonArray(sales, Sale.serializer());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public List<Tender> getTenders() {
        return tenders;
    }

    public void setTenders(List<Tender> tenders) {
        this.tenders = tenders;
    }

    public Set<SaleItem> getSaleItems() {
        return saleItems;
    }

    public void setSaleItems(Set<SaleItem> saleItems) {
        this.saleItems = saleItems;
    }
}