package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.ContractDto;
import com.rewixxcloudapp.entity.Contract;
import com.rewixxcloudapp.entity.ContractStatus;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.entity.Payment;
import com.rewixxcloudapp.repository.ContractRepository;
import com.rewixxcloudapp.repository.CustomerRepository;
import com.rewixxcloudapp.repository.JobRepository;
import com.rewixxcloudapp.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public Contract createContract(ContractDto dto, Long userId) {
        Contract contract = new Contract();
        contract.setUserId(userId);

        // Company info
        contract.setCompanyName(dto.getCompanyName());
        contract.setCompanyAddress(dto.getCompanyAddress());
        contract.setCompanyPhone(dto.getCompanyPhone());
        contract.setCompanyEmail(dto.getCompanyEmail());
        contract.setLicenseNumber(dto.getLicenseNumber());
        contract.setIdNumber(dto.getIdNumber());

        // Customer info
        contract.setCustomerName(dto.getCustomerName());
        contract.setCustomerAddress(dto.getCustomerAddress());

        if (dto.getCustomerId() != null) {
            Optional<Customer> customer = customerRepository.findByIdAndUserId(dto.getCustomerId(), userId);
            customer.ifPresent(contract::setCustomer);
        }

        if (dto.getJobId() != null) {
            Optional<Job> job = jobRepository.findByIdAndUserId(dto.getJobId(), userId);
            job.ifPresent(contract::setJob);
        }

        // Contract details
        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            contract.setContractDate(LocalDate.parse(dto.getDate(), DateTimeFormatter.ISO_DATE));
        } else {
            contract.setContractDate(LocalDate.now());
        }

        contract.setScopeOfWork(dto.getScopeOfWork());
        contract.setWarranty(dto.getWarranty());

        // Payment terms
        contract.setDepositPercent(dto.getDepositPercent());
        contract.setPaymentMethods(dto.getPaymentMethods());

        // If job is connected, sync price and status from job
        if (contract.getJob() != null) {
            syncContractWithJob(contract);
        } else {
            // Only use DTO values if no job is connected
            contract.setTotalPrice(dto.getTotalPrice());
            if (dto.getStatus() != null) {
                contract.setStatus(ContractStatus.valueOf(dto.getStatus().toUpperCase()));
            } else {
                contract.setStatus(ContractStatus.UNPAID);
            }
        }

        return contractRepository.save(contract);
    }

    public Optional<Contract> getContractById(Long id, Long userId) {
        Optional<Contract> contractOpt = contractRepository.findByIdAndUserId(id, userId);
        if (contractOpt.isPresent()) {
            Contract contract = contractOpt.get();
            syncContractWithJob(contract);
            return Optional.of(contract);
        }
        return contractOpt;
    }

    public List<Contract> getAllContracts(Long userId) {
        return contractRepository.findByUserIdOrderByContractDateDesc(userId);
    }

    public Map<String, Object> getContractsList(int page, int pageSize, String searchTerm, Long userId) {
        PageRequest pageRequest = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "contractDate"));

        Page<Contract> contractPage;
        if (searchTerm != null && !searchTerm.isEmpty()) {
            contractPage = contractRepository.findByUserIdAndCustomerNameContainingIgnoreCase(userId, searchTerm, pageRequest);
        } else {
            contractPage = contractRepository.findByUserId(userId, pageRequest);
        }

        // Sync contract price and status with connected job
        List<Contract> contracts = contractPage.getContent();
        for (Contract contract : contracts) {
            syncContractWithJob(contract);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("contracts", contracts);
        result.put("totalCount", contractPage.getTotalElements());
        result.put("totalPages", contractPage.getTotalPages());
        result.put("currentPage", page);

        return result;
    }

    private void syncContractWithJob(Contract contract) {
        if (contract.getJob() == null) {
            return; // No job connected, keep contract values as-is
        }

        Job job = contract.getJob();

        // Calculate total job cost (material cost + job price + tax)
        BigDecimal materialCost = job.getCustomMaterialCost() != null ?
            BigDecimal.valueOf(job.getCustomMaterialCost()) : BigDecimal.ZERO;
        BigDecimal jobPrice = job.getJobPrice() != null ?
            BigDecimal.valueOf(job.getJobPrice()) : BigDecimal.ZERO;

        BigDecimal subtotal = materialCost.add(jobPrice);
        BigDecimal tax = (job.getIncludeTax() != null && job.getIncludeTax()) ?
            subtotal.multiply(BigDecimal.valueOf(0.06)) : BigDecimal.ZERO;
        BigDecimal totalJobCost = subtotal.add(tax);

        // Update contract price to match job total cost
        contract.setTotalPrice(totalJobCost);

        // Calculate payment status from job payments
        BigDecimal totalPaid = paymentRepository.getTotalPaidByJobId(job.getId());
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        // Determine contract status based on payment status
        ContractStatus contractStatus = ContractStatus.UNPAID;
        if (totalJobCost.compareTo(BigDecimal.ZERO) > 0) {
            if (totalPaid.compareTo(totalJobCost) >= 0) {
                contractStatus = ContractStatus.PAID;
            } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                contractStatus = ContractStatus.PARTIAL;
            }
        }

        // Update contract status to match job payment status
        contract.setStatus(contractStatus);
    }

    public Contract updateContract(Long id, ContractDto dto, Long userId) {
        Optional<Contract> contractOpt = contractRepository.findByIdAndUserId(id, userId);
        if (contractOpt.isEmpty()) {
            throw new IllegalArgumentException("Contract not found");
        }

        Contract contract = contractOpt.get();

        if (dto.getCompanyName() != null) contract.setCompanyName(dto.getCompanyName());
        if (dto.getCompanyAddress() != null) contract.setCompanyAddress(dto.getCompanyAddress());
        if (dto.getCompanyPhone() != null) contract.setCompanyPhone(dto.getCompanyPhone());
        if (dto.getCompanyEmail() != null) contract.setCompanyEmail(dto.getCompanyEmail());
        if (dto.getLicenseNumber() != null) contract.setLicenseNumber(dto.getLicenseNumber());
        if (dto.getIdNumber() != null) contract.setIdNumber(dto.getIdNumber());
        if (dto.getCustomerName() != null) contract.setCustomerName(dto.getCustomerName());
        if (dto.getCustomerAddress() != null) contract.setCustomerAddress(dto.getCustomerAddress());
        if (dto.getScopeOfWork() != null) contract.setScopeOfWork(dto.getScopeOfWork());
        if (dto.getWarranty() != null) contract.setWarranty(dto.getWarranty());
        if (dto.getDepositPercent() != null) contract.setDepositPercent(dto.getDepositPercent());
        if (dto.getPaymentMethods() != null) contract.setPaymentMethods(dto.getPaymentMethods());

        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            contract.setContractDate(LocalDate.parse(dto.getDate(), DateTimeFormatter.ISO_DATE));
        }

        // Update job connection if provided
        if (dto.getJobId() != null) {
            Optional<Job> job = jobRepository.findByIdAndUserId(dto.getJobId(), userId);
            job.ifPresent(contract::setJob);
        }

        // If job is connected, sync price and status from job (don't allow manual override)
        if (contract.getJob() != null) {
            syncContractWithJob(contract);
        } else {
            // Only use DTO values if no job is connected
            if (dto.getTotalPrice() != null) contract.setTotalPrice(dto.getTotalPrice());
            if (dto.getStatus() != null) {
                contract.setStatus(ContractStatus.valueOf(dto.getStatus().toUpperCase()));
            }
        }

        return contractRepository.save(contract);
    }

    public void deleteContract(Long id, Long userId) {
        Optional<Contract> contract = contractRepository.findByIdAndUserId(id, userId);
        contract.ifPresent(contractRepository::delete);
    }

    public Optional<Contract> getContractByJobId(Long jobId, Long userId) {
        Optional<Contract> contractOpt = contractRepository.findByJobIdAndUserId(jobId, userId);
        if (contractOpt.isPresent()) {
            Contract contract = contractOpt.get();
            syncContractWithJob(contract);
            return Optional.of(contract);
        }
        return contractOpt;
    }
}
