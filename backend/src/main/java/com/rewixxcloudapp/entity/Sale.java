package com.warehouse.entity.sale;

import com.warehouse.entity.tender.Tender;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Sale entity
 */
@Entity
@Table(name = "sales")
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;

    private String description;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Tender> tenders;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<SaleItem> saleItems;

    // Constructors
    public Sale() {}

    public Sale(LocalDateTime date, String description) {
        this.date = date;
        this.description = description;
    }

    // Getters and Setters
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

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Sale sale = (Sale) o;
        return Objects.equals(id, sale.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Sale{" +
                "id=" + id +
                ", date=" + date +
                ", description='" + description + '\'' +
                '}';
    }
}