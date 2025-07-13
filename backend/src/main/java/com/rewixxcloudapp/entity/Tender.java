package com.rewixxcloudapp.entity;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tenders")
public class Tender {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amount; // Negative for expenses, positive for income

    @Enumerated(EnumType.STRING)
    private TenderType type;

    @ManyToOne
    private Sale sale;

    @ManyToOne
    private Currency currency;

    public Tender() {
    }

    public Tender(BigDecimal amount, TenderType type) {
        this.amount = amount;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public TenderType getType() {
        return type;
    }

    public void setType(TenderType type) {
        this.type = type;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }
}