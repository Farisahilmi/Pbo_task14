package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "booking_id", nullable = false)
    public Long bookingId;

    @Column(name = "order_id", nullable = false, unique = true)
    public String orderId; // bookingCode e.g. TIX-1783291609019-282

    @Column(name = "snap_token")
    public String snapToken;

    @Column(name = "redirect_url")
    public String redirectUrl;

    @Column(name = "gross_amount", nullable = false)
    public BigDecimal grossAmount = BigDecimal.ZERO;

    @Column(name = "payment_method")
    public String paymentMethod;

    @Column(nullable = false)
    public String status = "PENDING"; // PENDING, SETTLEMENT, CAPTURE, DENY, CANCEL, EXPIRE

    @Column(name = "transaction_id")
    public String transactionId;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public static Payment findByBookingId(Long bookingId) {
        return find("bookingId", bookingId).firstResult();
    }

    public static Payment findByOrderId(String orderId) {
        return find("orderId", orderId).firstResult();
    }
}
