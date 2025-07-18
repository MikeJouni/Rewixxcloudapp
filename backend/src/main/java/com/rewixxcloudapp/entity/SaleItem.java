package com.warehouse.entity.sale;

import com.warehouse.entity.product.Product;

import javax.persistence.*;

/**
 * SaleItem entity
 * Represents individual items within a sale transaction
 */
@Entity
@Table(name = "sale_items")
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Quantity of the product in this sale item
     * Positive = product sold (inventory out)
     * Negative = product received (inventory in)
     */
    private int quantity;

    // Constructors
    public SaleItem() {}

    public SaleItem(Sale sale, Product product, int quantity) {
        this.sale = sale;
        this.product = product;
        this.quantity = quantity;
    }

    // Getters and Setters
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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    // Business methods
    public boolean isInventoryOut() {
        return quantity > 0;
    }

    public boolean isInventoryIn() {
        return quantity < 0;
    }

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SaleItem saleItem = (SaleItem) o;
        return Objects.equals(id, saleItem.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "SaleItem{" +
                "id=" + id +
                ", quantity=" + quantity +
                ", product=" + (product != null ? product.getName() : "null") +
                '}';
    }
}