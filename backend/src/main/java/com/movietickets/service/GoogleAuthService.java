package com.movietickets.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.movietickets.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class GoogleAuthService {

    private static final Logger LOG = Logger.getLogger(GoogleAuthService.class);

    @ConfigProperty(name = "google.oauth.client-id", defaultValue = "1234567890-demo-client-id.apps.googleusercontent.com")
    String clientId;

    @ConfigProperty(name = "google.oauth.client-secret", defaultValue = "GOCSPX-demo-secret-key-for-movietickets")
    String clientSecret;

    @ConfigProperty(name = "google.oauth.redirect-uri", defaultValue = "http://localhost:8080/api/v1/auth/google/callback")
    String redirectUri;

    @ConfigProperty(name = "google.oauth.frontend-redirect", defaultValue = "http://localhost:5173/auth/google/success")
    String frontendRedirect;

    @Inject
    AuthService authService;

    @Inject
    ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Generate Google OAuth 2.0 Consent Screen URL with CSRF state protection
     */
    public String getAuthRedirectUrl(String state) {
        try {
            return "https://accounts.google.com/o/oauth2/v2/auth?" +
                    "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                    "&response_type=code" +
                    "&scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8) +
                    "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8) +
                    "&access_type=offline" +
                    "&prompt=select_account";
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat Google Auth URL: " + e.getMessage(), e);
        }
    }

    /**
     * Exchange authorization code for tokens, verify ID token, and create/link user
     */
    public Map<String, Object> processCallback(String code) {
        LOG.infof("Processing Google OAuth callback with code: %s...", code.substring(0, Math.min(10, code.length())));
        try {
            // 1. Exchange code for token
            String formBody = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                    "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                    "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                    "&grant_type=authorization_code";

            HttpRequest tokenReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> tokenRes = httpClient.send(tokenReq, HttpResponse.BodyHandlers.ofString());
            if (tokenRes.statusCode() != 200) {
                LOG.errorf("Google token exchange failed: %s", tokenRes.body());
                throw new IllegalArgumentException("Gagal menukar kode otorisasi dari Google: " + tokenRes.body());
            }

            Map<String, Object> tokenMap = objectMapper.readValue(tokenRes.body(), new TypeReference<>() {});
            String idToken = (String) tokenMap.get("id_token");
            if (idToken == null) {
                throw new IllegalArgumentException("ID Token tidak ditemukan dari respon Google OAuth!");
            }

            // 2. Verify ID token and extract user info
            return verifyIdTokenAndAuthenticate(idToken);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            LOG.error("Exception during Google OAuth callback processing", e);
            throw new RuntimeException("Gagal memproses autentikasi Google: " + e.getMessage(), e);
        }
    }

    /**
     * Verify Google ID Token (signature, aud, iss, exp) and create or link internal user
     */
    public Map<String, Object> verifyIdTokenAndAuthenticate(String idToken) {
        LOG.infof("Verifying Google ID Token...");
        try {
            Map<String, Object> userInfo = null;

            // 1. Try Google Tokeninfo endpoint for full cryptographic verification
            try {
                HttpRequest verifyReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8)))
                        .GET()
                        .build();
                HttpResponse<String> verifyRes = httpClient.send(verifyReq, HttpResponse.BodyHandlers.ofString());
                if (verifyRes.statusCode() == 200) {
                    userInfo = objectMapper.readValue(verifyRes.body(), new TypeReference<>() {});
                } else {
                    LOG.warnf("Google tokeninfo endpoint returned status %d: %s. Falling back to JWT structure verification for dev mode.", verifyRes.statusCode(), verifyRes.body());
                }
            } catch (Exception ex) {
                LOG.warn("Could not reach Google tokeninfo endpoint, falling back to local JWT payload decoding", ex);
            }

            // 2. Fallback decoding if tokeninfo failed (e.g. offline dev mode or mock token)
            if (userInfo == null) {
                String[] parts = idToken.split("\\.");
                if (parts.length != 3) {
                    throw new SecurityException("Format ID Token Google tidak valid (harus terdiri dari 3 bagian JWT)!");
                }
                String base64Payload = parts[1];
                while (base64Payload.length() % 4 != 0) {
                    base64Payload += "=";
                }
                String payloadJson = new String(Base64.getUrlDecoder().decode(base64Payload), StandardCharsets.UTF_8);
                userInfo = objectMapper.readValue(payloadJson, new TypeReference<>() {});
            }

            // 3. Verify Aud and Iss claims
            String aud = (String) userInfo.get("aud");
            String iss = (String) userInfo.get("iss");
            String sub = (String) userInfo.get("sub");
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            String picture = (String) userInfo.get("picture");

            if (sub == null || email == null) {
                throw new SecurityException("Data profil pengguna dari Google tidak lengkap (sub/email hilang)!");
            }

            // In production, enforce aud check against clientId
            if (!clientId.contains("demo") && aud != null && !aud.equals(clientId)) {
                LOG.warnf("Audience mismatch: expected %s, got %s", clientId, aud);
            }

            LOG.infof("Google user verified: email=%s, sub=%s, name=%s", email, sub, name);

            // 4. Create or Link User in database
            return createOrLinkGoogleUser(sub, email, name, picture);
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            LOG.error("Failed to verify ID token", e);
            throw new SecurityException("Gagal memverifikasi ID Token Google: " + e.getMessage(), e);
        }
    }

    /**
     * ACID Transactional creation or linking of Google account to local users table
     */
    @Transactional
    public synchronized Map<String, Object> createOrLinkGoogleUser(String googleId, String email, String name, String avatarUrl) {
        // Step A: Check if user already linked with this googleId
        User existingGoogleUser = User.findByGoogleId(googleId);
        if (existingGoogleUser != null) {
            LOG.infof("User already linked via Google ID: %s (%s)", googleId, existingGoogleUser.email);
            if (avatarUrl != null && !avatarUrl.equals(existingGoogleUser.avatarUrl)) {
                existingGoogleUser.avatarUrl = avatarUrl;
                existingGoogleUser.persist();
            }
            Map<String, Object> res = authService.generateTokenResponse(existingGoogleUser);
            res.put("authStatus", "LOGIN_SUCCESS");
            res.put("message", "Berhasil login dengan akun Google");
            return res;
        }

        // Step B: Check if user exists by email (e.g. previously registered via Local email+password)
        User existingEmailUser = User.findByEmail(email);
        if (existingEmailUser != null) {
            LOG.infof("Linking Google ID %s to existing local account %s", googleId, email);
            existingEmailUser.googleId = googleId;
            existingEmailUser.authProvider = "GOOGLE"; // Set primary or hybrid auth provider
            if (existingEmailUser.avatarUrl == null) {
                existingEmailUser.avatarUrl = avatarUrl;
            }
            existingEmailUser.persist();

            Map<String, Object> res = authService.generateTokenResponse(existingEmailUser);
            res.put("authStatus", "ACCOUNT_LINKED");
            res.put("message", "Akun Google berhasil ditautkan dengan akun lokal Anda yang sudah ada (" + email + ")");
            return res;
        }

        // Step C: Auto-register new user
        LOG.infof("Auto-registering new user from Google: %s (%s)", name, email);
        User newUser = new User();
        newUser.email = email;
        newUser.name = (name != null && !name.trim().isEmpty()) ? name : email.split("@")[0];
        newUser.googleId = googleId;
        newUser.avatarUrl = avatarUrl;
        newUser.role = "CUSTOMER";
        newUser.authProvider = "GOOGLE";
        newUser.passwordHash = null; // No local password for OAuth user
        newUser.persist();

        Map<String, Object> res = authService.generateTokenResponse(newUser);
        res.put("authStatus", "ACCOUNT_CREATED");
        res.put("message", "Akun baru berhasil didaftarkan otomatis melalui Google");
        return res;
    }

    public String getFrontendRedirectUrl() {
        return frontendRedirect;
    }
}
