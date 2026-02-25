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

    @PostMapping("/search")
    public ResponseEntity<List<Product>> searchProductsByName(@RequestBody java.util.Map<String, String> request) {
        try {
            String name = request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            String trimmedName = name.trim();
            logger.info("Searching for products with name: '{}'", trimmedName);
            
            // First try exact match (case-insensitive)
            List<Product> exactMatches = productRepository.findByNameIgnoreCase(trimmedName);
            if (!exactMatches.isEmpty()) {
                logger.info("Found {} exact matches for '{}'", exactMatches.size(), trimmedName);
                return ResponseEntity.ok(exactMatches);
            }
            
            // Fall back to partial match if no exact matches
            List<Product> partialMatches = productRepository.findByNameContainingIgnoreCase(trimmedName);
            logger.info("Found {} partial matches for '{}'", partialMatches.size(), trimmedName);
            return ResponseEntity.ok(partialMatches);
            
        } catch (Exception e) {
            logger.error("Error searching products by name", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
