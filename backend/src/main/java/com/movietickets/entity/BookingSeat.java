package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "booking_seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"booking_id", "seat_id"})
})
public class BookingSeat extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "booking_id", nullable = false)
    public Long bookingId;

    @Column(name = "seat_id", nullable = false)
    public Long seatId;

    @Column(nullable = false)
    public BigDecimal price;

    public static List<BookingSeat> findByBooking(Long bookingId) {
        return list("bookingId", bookingId);
    }
}
