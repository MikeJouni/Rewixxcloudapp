package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.PaymentDto;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.Payment;
import com.rewixxcloudapp.entity.PaymentType;
import com.rewixxcloudapp.repository.JobRepository;
import com.rewixxcloudapp.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JobRepository jobRepository;

    public List<Payment> getPaymentsByJobId(Long jobId) {
        logger.info("Fetching payments for job ID: {}", jobId);
        return paymentRepository.findByJobId(jobId);
    }

    public BigDecimal getTotalPaidByJobId(Long jobId) {
        logger.info("Calculating total paid for job ID: {}", jobId);
        BigDecimal total = paymentRepository.getTotalPaidByJobId(jobId);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal calculateJobTotalCost(Job job) {
        // Calculate total cost: customMaterialCost + jobPrice + tax
        BigDecimal materialCost = job.getCustomMaterialCost() != null ?
            BigDecimal.valueOf(job.getCustomMaterialCost()) : BigDecimal.ZERO;
        BigDecimal jobPrice = job.getJobPrice() != null ?
            BigDecimal.valueOf(job.getJobPrice()) : BigDecimal.ZERO;

        BigDecimal subtotal = materialCost.add(jobPrice);

        // Add 6% tax if includeTax is true
        if (job.getIncludeTax() != null && job.getIncludeTax()) {
            BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.06));
            subtotal = subtotal.add(tax);
        }

        return subtotal;
    }

    public Payment createPayment(PaymentDto dto) {
        logger.info("Creating payment for job ID: {}", dto.getJobId());

        // Validate required fields
        if (dto.getJobId() == null) {
            throw new IllegalArgumentException("Job ID is required");
        }
        if (dto.getPaymentType() == null) {
            throw new IllegalArgumentException("Payment type is required");
        }
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        // Validate check number if payment type is CHECK
        if (dto.getPaymentType() == PaymentType.CHECK) {
            if (dto.getCheckNumber() == null || dto.getCheckNumber().trim().isEmpty()) {
                throw new IllegalArgumentException("Check number is required for check payments");
            }
        }

        // Verify job exists
        Optional<Job> jobOpt = jobRepository.findById(dto.getJobId());
        if (!jobOpt.isPresent()) {
            throw new IllegalArgumentException("Job not found with ID: " + dto.getJobId());
        }

        Job job = jobOpt.get();

        // Calculate total cost and validate payment doesn't exceed remaining balance
        BigDecimal totalCost = calculateJobTotalCost(job);
        BigDecimal totalPaid = getTotalPaidByJobId(dto.getJobId());
        BigDecimal remainingBalance = totalCost.subtract(totalPaid);

        if (dto.getAmount().compareTo(remainingBalance) > 0) {
            throw new IllegalArgumentException(
                String.format("Payment amount ($%s) exceeds remaining balance ($%s). Total cost: $%s, Already paid: $%s",
                    dto.getAmount(), remainingBalance, totalCost, totalPaid)
            );
        }

        Payment payment = new Payment();
        payment.setJob(jobOpt.get());
        payment.setPaymentType(dto.getPaymentType());
        payment.setAmount(dto.getAmount());
        payment.setCheckNumber(dto.getCheckNumber());

        if (dto.getPaymentDate() != null) {
            payment.setPaymentDate(dto.getPaymentDate());
        }

        Payment savedPayment = paymentRepository.save(payment);
        logger.info("Payment created successfully with ID: {}", savedPayment.getId());
        return savedPayment;
    }

    public void deletePayment(Long id) {
        logger.info("Deleting payment with ID: {}", id);

        if (!paymentRepository.existsById(id)) {
            throw new IllegalArgumentException("Payment not found with ID: " + id);
        }

        paymentRepository.deleteById(id);
        logger.info("Payment deleted successfully: {}", id);
    }
}
