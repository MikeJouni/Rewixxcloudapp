package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.entity.Product;
import com.rewixxcloudapp.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductRepository productRepository;

    @PostMapping("/list")
    public ResponseEntity<List<Product>> listAllProducts() {
        try {
            List<Product> products = productRepository.findAll();
            return ResponseEntity.ok()
                .header("ngrok-skip-browser-warning", "true")
                .body(products);
        } catch (Exception e) {
            logger.error("Error getting all products", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        try {
            Optional<Product> product = productRepository.findById(id);
            return product.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting product by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        try {
            Product savedProduct = productRepository.save(product);
            return ResponseEntity.ok(savedProduct);
        } catch (Exception e) {
            logger.error("Error creating product", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
