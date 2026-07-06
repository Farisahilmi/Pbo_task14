package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "tickets")
public class Ticket extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "ticket_code", unique = true, nullable = false)
    public String ticketCode;

    @Column(name = "booking_id", nullable = false)
    public Long bookingId;

    @Column(name = "booking_seat_id", nullable = false)
    public Long bookingSeatId;

    @Column(name = "seat_label", nullable = false)
    public String seatLabel; // e.g. "D-4"

    @Column(name = "qr_code_value", unique = true, nullable = false)
    public String qrCodeValue; // Signed JWT or unique token

    @Column(nullable = false)
    public String status; // VALID, USED, CANCELLED

    @Column(name = "used_at")
    public Instant usedAt;

    public static List<Ticket> findByBooking(Long bookingId) {
        return list("bookingId", bookingId);
    }

    public static Ticket findByQrCode(String qrCodeValue) {
        return find("qrCodeValue", qrCodeValue).firstResult();
    }
}
