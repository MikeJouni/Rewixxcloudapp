package com.rewixxcloudapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Autowired
    private S3Client s3Client;

    private final String bucketName = System.getenv("AWS_S3_BUCKET_NAME");
    private final String region = System.getenv("AWS_REGION");

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (bucketName == null) {
                return ResponseEntity.badRequest().body("S3 bucket name not configured");
            }

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("File size exceeds 10MB limit");
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key("receipts/" + uniqueFilename)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Return the S3 URL
            String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/receipts/%s",
                    bucketName, region, uniqueFilename);

            return ResponseEntity.ok(fileUrl);

        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error uploading file: " + e.getMessage());
        }
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<List<String>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            if (bucketName == null) {
                return ResponseEntity.badRequest().body(null);
            }

            List<String> uploadedUrls = new ArrayList<>();

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue; // Skip empty files
                }

                // Validate file size (10MB limit)
                if (file.getSize() > 10 * 1024 * 1024) {
                    continue; // Skip oversized files
                }

                // Generate unique filename
                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename != null
                        ? originalFilename.substring(originalFilename.lastIndexOf("."))
                        : "";
                String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

                // Upload to S3
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key("receipts/" + uniqueFilename)
                        .contentType(file.getContentType())
                        .build();

                s3Client.putObject(putObjectRequest,
                        RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                // Add the S3 URL to results
                String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/receipts/%s",
                        bucketName, region, uniqueFilename);
                uploadedUrls.add(fileUrl);
            }

            return ResponseEntity.ok(uploadedUrls);

        } catch (IOException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}