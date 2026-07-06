package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "booking_code", unique = true, nullable = false)
    public String bookingCode;

    @Column(name = "user_id", nullable = false)
    public Long userId;

    @Column(name = "showtime_id", nullable = false)
    public Long showtimeId;

    @Column(nullable = false)
    public String status; // PENDING, PAID, EXPIRED, CANCELLED, REFUNDED

    @Column(name = "total_amount", nullable = false)
    public BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount")
    public BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false)
    public BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "promo_code")
    public String promoCode;

    @Column(name = "payment_method")
    public String paymentMethod; // QRIS, GOPAY, OVO, VA_BCA

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "expired_at")
    public Instant expiredAt;

    @Column(name = "paid_at")
    public Instant paidAt;

    public static List<Booking> findByUser(Long userId) {
        return list("userId = ?1 ORDER BY createdAt DESC", userId);
    }

    public static Booking findByCode(String bookingCode) {
        return find("bookingCode", bookingCode).firstResult();
    }
}
