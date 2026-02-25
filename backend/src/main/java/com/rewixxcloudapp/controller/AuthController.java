package com.rewixxcloudapp.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.entity.AuthUser;
import com.rewixxcloudapp.entity.AccountSettings;
import com.rewixxcloudapp.repository.AuthUserRepository;
import com.rewixxcloudapp.repository.AccountSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthUserRepository authUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AccountSettingsRepository accountSettingsRepository;

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final SecureRandom secureRandom = new SecureRandom();

    static class GoogleAuthRequest {
        @JsonProperty("idToken")
        public String idToken;
    }

    static class LoginRequest {
        public String email;
        public String password;
        public boolean rememberMe;
    }

    static class ResetPasswordRequest {
        public String email;
    }

    static class RegisterRequest {
        public String email;
        public String password;
        public String name; // Optional name for account settings
    }

    static class ChangePasswordRequest {
        public String newPassword;
        public String oldPassword; // Optional - not required for Google OAuth users
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleAuthRequest request) {
        try {
            if (request == null || request.idToken == null || request.idToken.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing idToken"));
            }

            // Verify token with Google tokeninfo endpoint
            String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.idToken;
            Map<String, Object> tokenInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);

            if (tokenInfo == null || tokenInfo.get("aud") == null || tokenInfo.get("email") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
            }

            String audience = (String) tokenInfo.get("aud");
            String email = (String) tokenInfo.get("email");
            String sub = (String) tokenInfo.get("sub");
            String name = (String) tokenInfo.get("name"); // Extract name from Google token

            if (!googleClientId.equals(audience)) {
                logger.warn("Google token audience mismatch. Expected {}, got {}", googleClientId, audience);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token audience"));
            }

            boolean isNewUser = false;
            String defaultPassword = null;

            // CRITICAL: Always identify users by Google sub FIRST - never by email
            // Each Google account must have its own separate account, even if emails match
            logger.info("=== GOOGLE LOGIN ATTEMPT ===");
            logger.info("Email from Google: {}", email);
            logger.info("Google sub from token: {}", sub);
            logger.info("Name from Google: {}", name);
            
            if (sub == null || sub.trim().isEmpty()) {
                logger.error("CRITICAL ERROR: Google sub is null or empty! Cannot identify user uniquely.");
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token: missing sub identifier"));
            }
            
            Optional<AuthUser> existingOpt = authUserRepository.findByGoogleSub(sub);
            AuthUser user;
            
            if (existingOpt.isPresent()) {
                // User exists with this Google sub - use existing account
                user = existingOpt.get();
                logger.info("✓ Found existing user by Google sub:");
                logger.info("  - userId: {}", user.getId());
                logger.info("  - email: {}", user.getEmail());
                logger.info("  - googleSub: {}", user.getGoogleSub());
                logger.info("  - Verifying googleSub matches: {} == {} ? {}", user.getGoogleSub(), sub, user.getGoogleSub().equals(sub));
                
                // CRITICAL VERIFICATION: Ensure the stored Google sub matches
                if (!sub.equals(user.getGoogleSub())) {
                    logger.error("CRITICAL ERROR: Stored googleSub ({}) doesn't match token googleSub ({})!", 
                        user.getGoogleSub(), sub);
                    return ResponseEntity.internalServerError().body(Map.of("error", 
                        "Account data mismatch. Please contact support."));
                }
                // Update email in case it changed (but keep the same userId)
                if (!email.equals(user.getEmail())) {
                    logger.info("Updating email for user {} from {} to {}", user.getId(), user.getEmail(), email);
                    user.setEmail(email);
                    user = authUserRepository.save(user);
                }
            } else {
                // No user found with this Google sub - MUST create a new account
                // CRITICAL: DO NOT link to existing accounts based on email - each Google account is separate
                logger.info("✗ No user found with Google sub: {}", sub);
                logger.info("Creating NEW account for email: {}", email);
                
                // Check if email already exists (for logging only - we allow multiple accounts with same email)
                Optional<AuthUser> existingByEmail = authUserRepository.findByEmail(email);
                if (existingByEmail.isPresent()) {
                    AuthUser existing = existingByEmail.get();
                    logger.info("⚠ Email {} already exists with userId {} and googleSub {}, but creating NEW account with googleSub {}. " +
                        "Multiple Google accounts can share the same email but will have separate accounts.", 
                        email, existing.getId(), existing.getGoogleSub(), sub);
                }
                
                isNewUser = true;
                defaultPassword = generateDefaultPassword();

                user = new AuthUser();
                user.setEmail(email);
                user.setGoogleSub(sub); // CRITICAL: Set Google sub
                user.setPasswordHash(passwordEncoder.encode(defaultPassword));
                
                try {
                    user = authUserRepository.save(user);
                    logger.info("✓ Created NEW user:");
                    logger.info("  - userId: {}", user.getId());
                    logger.info("  - email: {}", user.getEmail());
                    logger.info("  - googleSub: {}", user.getGoogleSub());
                    
                    // VERIFY the Google sub was saved correctly
                    Optional<AuthUser> verifyUser = authUserRepository.findById(user.getId());
                    if (verifyUser.isPresent()) {
                        AuthUser verified = verifyUser.get();
                        logger.info("✓ Verification - Retrieved user from DB:");
                        logger.info("  - userId: {}", verified.getId());
                        logger.info("  - email: {}", verified.getEmail());
                        logger.info("  - googleSub: {}", verified.getGoogleSub());
                        if (!sub.equals(verified.getGoogleSub())) {
                            logger.error("CRITICAL ERROR: Google sub was not saved correctly! Expected: {}, Got: {}", 
                                sub, verified.getGoogleSub());
                        }
                    }
                } catch (Exception e) {
                    logger.error("Failed to create new user: {}", e.getMessage(), e);
                    // Check if it's a constraint violation
                    String errorMsg = e.getMessage();
                    if (errorMsg != null && (errorMsg.contains("email") || errorMsg.contains("unique") || errorMsg.contains("constraint"))) {
                        return ResponseEntity.badRequest().body(Map.of("error", 
                            "This email is already registered. Each Google account must have a unique email address. " +
                            "Please use a different email or contact support."));
                    }
                    return ResponseEntity.badRequest().body(Map.of("error", 
                        "Failed to create account. Please try again or contact support."));
                }
                
                // Create account settings with Google name as default company name (only for truly new users)
                if (isNewUser) {
                    // Check if account settings already exist (shouldn't for new users, but check anyway)
                    Optional<AccountSettings> existingSettings = accountSettingsRepository.findByUserId(user.getId());
                    if (existingSettings.isEmpty()) {
                        if (name != null && !name.trim().isEmpty()) {
                            AccountSettings accountSettings = new AccountSettings(name.trim());
                            accountSettings.setUserId(user.getId());
                            accountSettings.setEmail(email);
                            accountSettingsRepository.save(accountSettings);
                            logger.info("Created account settings for new user {} with company name: {}", user.getId(), name);
                        } else {
                            // Fallback to email if name is not available
                            AccountSettings accountSettings = new AccountSettings(email);
                            accountSettings.setUserId(user.getId());
                            accountSettings.setEmail(email);
                            accountSettingsRepository.save(accountSettings);
                            logger.info("Created account settings for new user {} with email as company name", user.getId());
                        }
                    } else {
                        logger.info("Account settings already exist for user {}, skipping creation", user.getId());
                    }
                }
            }
            
            logger.info("=== GENERATING JWT TOKEN ===");
            logger.info("userId: {}", user.getId());
            logger.info("email: {}", user.getEmail());
            logger.info("googleSub: {}", user.getGoogleSub());
            logger.info("=== END GOOGLE LOGIN ===");

            String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("isNewUser", isNewUser);
            if (isNewUser) {
                response.put("defaultPassword", defaultPassword);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during Google login", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error during Google login: " + e.getMessage()));
        }
    }

    // Hardcoded admin credentials
    private static final String ADMIN_EMAIL = "admin@rewixx.com";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final Long ADMIN_USER_ID = 0L;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            if (request == null || request.email == null || request.password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
            }

            String email = request.email.trim().toLowerCase();

            // Hardcoded admin login bypass
            if (ADMIN_EMAIL.equals(email) && ADMIN_PASSWORD.equals(request.password)) {
                logger.info("Admin login via hardcoded credentials");
                String jwt = jwtUtil.generateToken(ADMIN_USER_ID, ADMIN_EMAIL);
                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                response.put("isNewUser", false);
                return ResponseEntity.ok(response);
            }

            Optional<AuthUser> userOpt = authUserRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            AuthUser user = userOpt.get();
            if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("isNewUser", false);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during email/password login", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error during login: " + e.getMessage()));
        }
    }

    /**
     * Admin/maintenance endpoint to reset a user's password.
     * In a real deployment this should be protected by proper admin auth.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            String email = request.email.trim().toLowerCase();
            Optional<AuthUser> userOpt = authUserRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found for email: " + email));
            }

            AuthUser user = userOpt.get();
            String tempPassword = generateDefaultPassword();
            user.setPasswordHash(passwordEncoder.encode(tempPassword));
            authUserRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("temporaryPassword", tempPassword);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error resetting password", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error resetting password: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            if (request == null || request.email == null || request.password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
            }

            String email = request.email.trim().toLowerCase();
            String password = request.password;

            // Validate password strength (minimum 6 characters)
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters long"));
            }

            // Check if email already exists (for non-Google accounts, email should be unique)
            Optional<AuthUser> existingOpt = authUserRepository.findByEmail(email);
            if (existingOpt.isPresent()) {
                AuthUser existing = existingOpt.get();
                // If user exists with Google OAuth, they should use Google sign-in
                if (existing.getGoogleSub() != null && !existing.getGoogleSub().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", 
                        "An account with this email already exists. Please sign in with Google or use a different email."));
                }
                return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists"));
            }

            // Create new user
            AuthUser user = new AuthUser();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            // googleSub is null for email/password accounts

            try {
                user = authUserRepository.save(user);
                logger.info("✓ Created new user via registration:");
                logger.info("  - userId: {}", user.getId());
                logger.info("  - email: {}", user.getEmail());

                // Create account settings
                String companyName = (request.name != null && !request.name.trim().isEmpty()) 
                    ? request.name.trim() 
                    : email.split("@")[0]; // Use email prefix as default company name
                
                AccountSettings accountSettings = new AccountSettings(companyName);
                accountSettings.setUserId(user.getId());
                accountSettings.setEmail(email);
                accountSettingsRepository.save(accountSettings);
                logger.info("Created account settings for new user {} with company name: {}", user.getId(), companyName);

                // Generate JWT token
                String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());

                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                response.put("message", "Account created successfully");

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                logger.error("Failed to create new user: {}", e.getMessage(), e);
                String errorMsg = e.getMessage();
                if (errorMsg != null && (errorMsg.contains("email") || errorMsg.contains("unique") || errorMsg.contains("constraint"))) {
                    return ResponseEntity.badRequest().body(Map.of("error", 
                        "An account with this email already exists."));
                }
                return ResponseEntity.badRequest().body(Map.of("error", 
                    "Failed to create account. Please try again."));
            }
        } catch (Exception e) {
            logger.error("Error during registration", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error during registration: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        try {
            if (request == null || request.newPassword == null || request.newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
            }

            String newPassword = request.newPassword;

            // Validate password strength
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters long"));
            }

            // Get user from JWT token
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.getUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
            }

            Optional<AuthUser> userOpt = authUserRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            AuthUser user = userOpt.get();
            
            // Check if user has Google OAuth (googleSub is set)
            boolean isGoogleUser = user.getGoogleSub() != null && !user.getGoogleSub().trim().isEmpty();
            
            if (isGoogleUser) {
                // Google OAuth users can change password without providing old password
                logger.info("Changing password for Google OAuth user {} (email: {})", userId, user.getEmail());
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                authUserRepository.save(user);
                
                return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
            } else {
                // Regular email/password users must provide old password
                if (request.oldPassword == null || request.oldPassword.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Old password is required"));
                }

                if (!passwordEncoder.matches(request.oldPassword, user.getPasswordHash())) {
                    return ResponseEntity.status(401).body(Map.of("error", "Old password is incorrect"));
                }

                logger.info("Changing password for email/password user {} (email: {})", userId, user.getEmail());
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                authUserRepository.save(user);
                
                return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
            }
        } catch (Exception e) {
            logger.error("Error changing password", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error changing password: " + e.getMessage()));
        }
    }

    private String generateDefaultPassword() {
        byte[] bytes = new byte[12];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.getUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
            }

            Optional<AuthUser> userOpt = authUserRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            AuthUser user = userOpt.get();
            Map<String, Object> info = new HashMap<>();
            info.put("userId", user.getId());
            info.put("email", user.getEmail());
            info.put("hasGoogleAccount", user.getGoogleSub() != null && !user.getGoogleSub().trim().isEmpty());

            return ResponseEntity.ok(info);
        } catch (Exception e) {
            logger.error("Error getting user info", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            String emailLower = email.trim().toLowerCase();
            Optional<AuthUser> existingOpt = authUserRepository.findByEmail(emailLower);
            
            Map<String, Object> response = new HashMap<>();
            if (existingOpt.isPresent()) {
                AuthUser existing = existingOpt.get();
                boolean isGoogleAccount = existing.getGoogleSub() != null && !existing.getGoogleSub().trim().isEmpty();
                response.put("exists", true);
                response.put("isGoogleAccount", isGoogleAccount);
                if (isGoogleAccount) {
                    response.put("message", "An account with this email already exists. Please sign in with Google.");
                } else {
                    response.put("message", "An account with this email already exists.");
                }
            } else {
                response.put("exists", false);
                response.put("available", true);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking email", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error checking email availability"));
        }
    }

    /**
     * Debug endpoint to verify token and user mapping
     * This helps diagnose issues where different Google accounts get the same userId
     */
    @GetMapping("/debug/user-info")
    public ResponseEntity<?> debugUserInfo(HttpServletRequest request) {
        try {
            Long userId = jwtUtil.getUserIdFromToken(request.getHeader("Authorization") != null 
                ? request.getHeader("Authorization").substring(7) : null);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No userId in token"));
            }
            
            Optional<AuthUser> userOpt = authUserRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            AuthUser user = userOpt.get();
            Map<String, Object> info = new HashMap<>();
            info.put("userId", user.getId());
            info.put("email", user.getEmail());
            info.put("googleSub", user.getGoogleSub());
            info.put("hasGoogleSub", user.getGoogleSub() != null && !user.getGoogleSub().trim().isEmpty());
            
            // Check if there are other users with the same email
            List<AuthUser> usersWithSameEmail = authUserRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().equals(user.getEmail()))
                .collect(java.util.stream.Collectors.toList());
            info.put("usersWithSameEmail", usersWithSameEmail.size());
            info.put("otherUsersWithSameEmail", usersWithSameEmail.stream()
                .map(u -> Map.of("userId", u.getId(), "email", u.getEmail(), "googleSub", u.getGoogleSub()))
                .collect(java.util.stream.Collectors.toList()));
            
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            logger.error("Error in debug endpoint", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}


