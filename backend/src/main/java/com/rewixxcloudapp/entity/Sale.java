package com.rewixxcloudapp.entity;

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