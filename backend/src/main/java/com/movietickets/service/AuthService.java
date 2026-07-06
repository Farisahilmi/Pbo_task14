package com.movietickets.service;

import com.movietickets.entity.User;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class AuthService {

    private static final Logger LOG = Logger.getLogger(AuthService.class);

    @Transactional
    public Map<String, Object> register(String name, String email, String phone, String password, LocalDate birthDate) {
        if (User.findByEmail(email) != null) {
            throw new IllegalArgumentException("Email sudah terdaftar!");
        }

        User user = new User();
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.passwordHash = hashPassword(password);
        user.role = "CUSTOMER";
        user.birthDate = birthDate;
        user.persist();

        LOG.infof("New user registered successfully: %s (ID: %d)", email, user.id);
        return generateTokenResponse(user);
    }

    public Map<String, Object> login(String email, String password) {
        User user = User.findByEmail(email);
        if (user == null || !user.passwordHash.equals(hashPassword(password))) {
            throw new IllegalArgumentException("Email atau password salah!");
        }

        LOG.infof("User logged in successfully: %s (ID: %d)", email, user.id);
        return generateTokenResponse(user);
    }

    public User getProfile(String email) {
        return User.findByEmail(email);
    }

    public Map<String, Object> generateTokenResponse(User user) {
        String token = Jwt.issuer("https://movietickets.id/issuer")
                .upn(user.email)
                .groups(user.role)
                .claim("userId", user.id)
                .claim("name", user.name)
                .claim("avatarUrl", user.avatarUrl != null ? user.avatarUrl : "")
                .sign();

        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("id", user.id); // Synchronize id and userId so frontend user.id is never undefined!
        res.put("userId", user.id);
        res.put("name", user.name);
        res.put("email", user.email);
        res.put("role", user.role);
        res.put("avatarUrl", user.avatarUrl);
        res.put("authProvider", user.authProvider);
        return res;
    }

    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((password + "movietickets_salt_2026").getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
