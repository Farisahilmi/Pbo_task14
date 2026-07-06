package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @Column(unique = true, nullable = false)
    public String email;

    public String phone;

    @Column(name = "password_hash")
    public String passwordHash;

    @Column(nullable = false)
    public String role; // CUSTOMER, CASHIER, ADMIN

    @Column(name = "birth_date")
    public LocalDate birthDate;

    @Column(name = "google_id", unique = true)
    public String googleId;

    @Column(name = "avatar_url")
    public String avatarUrl;

    @Column(name = "auth_provider", nullable = false)
    public String authProvider = "LOCAL";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }

    public static User findByGoogleId(String googleId) {
        return find("googleId", googleId).firstResult();
    }
}
