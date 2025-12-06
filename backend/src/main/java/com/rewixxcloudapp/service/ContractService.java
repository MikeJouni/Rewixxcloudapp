package com.rewixxcloudapp.service;

import com.rewixxcloudapp.dto.ContractDto;
import com.rewixxcloudapp.entity.Contract;
import com.rewixxcloudapp.entity.ContractStatus;
import com.rewixxcloudapp.entity.Customer;
import com.rewixxcloudapp.entity.Job;
import com.rewixxcloudapp.repository.ContractRepository;
import com.rewixxcloudapp.repository.CustomerRepository;
import com.rewixxcloudapp.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
        contract.setTotalPrice(dto.getTotalPrice());
        contract.setWarranty(dto.getWarranty());

        // Payment terms
        contract.setDepositPercent(dto.getDepositPercent());
        contract.setPaymentMethods(dto.getPaymentMethods());

        // Status
        if (dto.getStatus() != null) {
            contract.setStatus(ContractStatus.valueOf(dto.getStatus().toUpperCase()));
        } else {
            contract.setStatus(ContractStatus.UNPAID);
        }

        return contractRepository.save(contract);
    }

    public Optional<Contract> getContractById(Long id, Long userId) {
        return contractRepository.findByIdAndUserId(id, userId);
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

        Map<String, Object> result = new HashMap<>();
        result.put("contracts", contractPage.getContent());
        result.put("totalCount", contractPage.getTotalElements());
        result.put("totalPages", contractPage.getTotalPages());
        result.put("currentPage", page);

        return result;
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
        if (dto.getTotalPrice() != null) contract.setTotalPrice(dto.getTotalPrice());
        if (dto.getWarranty() != null) contract.setWarranty(dto.getWarranty());
        if (dto.getDepositPercent() != null) contract.setDepositPercent(dto.getDepositPercent());
        if (dto.getPaymentMethods() != null) contract.setPaymentMethods(dto.getPaymentMethods());

        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            contract.setContractDate(LocalDate.parse(dto.getDate(), DateTimeFormatter.ISO_DATE));
        }

        if (dto.getStatus() != null) {
            contract.setStatus(ContractStatus.valueOf(dto.getStatus().toUpperCase()));
        }

        return contractRepository.save(contract);
    }

    public void deleteContract(Long id, Long userId) {
        Optional<Contract> contract = contractRepository.findByIdAndUserId(id, userId);
        contract.ifPresent(contractRepository::delete);
    }
}
