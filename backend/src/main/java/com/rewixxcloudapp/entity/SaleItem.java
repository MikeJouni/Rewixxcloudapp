package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.util.Collection;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "sale_items")
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("sale-saleItems")
    private Sale sale;

    @ManyToOne
    private Product product;

    private Integer quantity; // Positive = product sold, Negative = product received (inventory in)
    
    private java.math.BigDecimal unitPrice; // Price per unit for this sale item

    public SaleItem() {
    }

    public SaleItem(Sale sale, Product product, Integer quantity, java.math.BigDecimal unitPrice) {
        this.sale = sale;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public java.math.BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(java.math.BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "quantity", "unitPrice", "product.id", "product.name", 
                        "product.unitPrice", "product.category", "product.description")
                .exclude("*");
    }

    public String toJson() {
        return SaleItem.serializer().serialize(this);
    }

    public static String toJsonArray(Collection<SaleItem> saleItems) {
        return JsonSerializer.toJsonArray(saleItems, SaleItem.serializer());
    }
}