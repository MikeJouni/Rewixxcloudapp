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
    
    // Allowed email addresses for sign-in
    private static final java.util.Set<String> ALLOWED_EMAILS = java.util.Set.of(
        "imadkassem44@gmail.com",
        "zainsbeihh@gmail.com"
    );
    
    private boolean isEmailAllowed(String email) {
        if (email == null) {
            return false;
        }
        return ALLOWED_EMAILS.contains(email.toLowerCase().trim());
    }

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
            
            // Check if email is allowed
            if (!isEmailAllowed(email)) {
                logger.warn("Access denied for email: {}", email);
                return ResponseEntity.status(403).body(Map.of("error", 
                    "Access denied. This application is restricted to authorized users only."));
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            if (request == null || request.email == null || request.password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
            }
            
            String email = request.email.trim().toLowerCase();
            
            // Check if email is allowed
            if (!isEmailAllowed(email)) {
                logger.warn("Access denied for email: {}", email);
                return ResponseEntity.status(403).body(Map.of("error", 
                    "Access denied. This application is restricted to authorized users only."));
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

    private String generateDefaultPassword() {
        byte[] bytes = new byte[12];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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


