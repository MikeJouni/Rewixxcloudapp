package com.rewixxcloudapp.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ContractDto {
    private Long id;

    // Company Information
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;
    private String licenseNumber;
    private String idNumber;

    // Customer Information
    private String customerName;
    private String customerAddress;
    private Long customerId;
    private Long jobId;

    // Contract Details
    private String date;
    private String scopeOfWork;
    private BigDecimal totalPrice;
    private String warranty;

    // Payment Terms
    private Integer depositPercent;
    private String paymentMethods;
    private String status;
}
