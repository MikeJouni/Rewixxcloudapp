package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.Collection;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private BigDecimal unitPrice;
    
    private String category;

    public Product() {
    }

    public Product(String name, String description, BigDecimal unitPrice) {
        this.name = name;
        this.description = description;
        this.unitPrice = unitPrice;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "name", "description", "unitPrice")
                .exclude("*");
    }

    public String toJson() {
        return Product.serializer().serialize(this);
    }

    public static String toJsonArray(Collection<Product> products) {
        return JsonSerializer.toJsonArray(products, Product.serializer());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
    
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}