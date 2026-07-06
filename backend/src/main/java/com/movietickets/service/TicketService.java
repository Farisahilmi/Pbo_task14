package com.movietickets.service;

import com.movietickets.entity.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import io.quarkus.runtime.StartupEvent;
import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class TicketService {

    private static final Logger LOG = Logger.getLogger(TicketService.class);

    @Transactional
    public void repairMissingTicketsOnStartup(@Observes StartupEvent event) {
        LOG.info("Running automatic startup verification for PAID bookings without tickets...");
        try {
            List<Booking> paidBookings = Booking.list("status", "PAID");
            int repairedCount = 0;
            for (Booking b : paidBookings) {
                List<Ticket> tickets = Ticket.findByBooking(b.id);
                if (tickets.isEmpty()) {
                    LOG.warnf("Found PAID booking without tickets: ID=%d, Code=%s. Generating tickets...", b.id, b.bookingCode);
                    generateTicketsForBooking(b.id);
                    repairedCount++;
                }
            }
            LOG.infof("Startup verification complete. Repaired %d bookings.", repairedCount);
        } catch (Exception e) {
            LOG.errorf("Error during startup ticket verification: %s", e.getMessage());
        }
    }

    @Transactional
    public List<Ticket> generateTicketsForBooking(Long bookingId) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null || !"PAID".equals(booking.status)) {
            throw new IllegalStateException("Pesanan belum dibayar atau tidak valid!");
        }

        List<Ticket> existingTickets = Ticket.findByBooking(bookingId);
        if (!existingTickets.isEmpty()) {
            LOG.infof("Tickets already generated for booking %d, skipping duplicate generation.", bookingId);
            return existingTickets;
        }

        List<BookingSeat> bSeats = BookingSeat.findByBooking(bookingId);
        List<Ticket> generatedTickets = new ArrayList<>();

        for (BookingSeat bs : bSeats) {
            Seat seat = Seat.findById(bs.seatId);
            String label = (seat != null) ? (seat.rowLabel + seat.seatNumber) : String.valueOf(bs.seatId);

            Ticket ticket = new Ticket();
            ticket.ticketCode = "TKT-" + booking.bookingCode + "-" + label;
            ticket.bookingId = booking.id;
            ticket.bookingSeatId = bs.id;
            ticket.seatLabel = label;
            ticket.qrCodeValue = "QR-MTX-" + booking.id + "-" + bs.id + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            ticket.status = "VALID";
            ticket.persist();

            generatedTickets.add(ticket);
        }

        LOG.infof("Successfully generated %d tickets for booking %d (%s)", generatedTickets.size(), booking.id, booking.bookingCode);
        return generatedTickets;
    }

    public List<Map<String, Object>> getMyTickets(Long userId) {
        List<Booking> bookings = Booking.findByUser(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Booking b : bookings) {
            if (!"PAID".equals(b.status)) {
                continue; // Only include PAID bookings in My Tickets!
            }

            Showtime st = Showtime.findById(b.showtimeId);
            if (st == null) continue;

            Movie movie = Movie.findById(st.movieId);
            Studio studio = Studio.findById(st.studioId);
            Cinema cinema = (studio != null) ? Cinema.findById(studio.cinemaId) : null;

            List<Ticket> tickets = Ticket.findByBooking(b.id);

            Map<String, Object> map = new HashMap<>();
            map.put("bookingId", b.id);
            map.put("bookingCode", b.bookingCode);
            map.put("status", b.status);
            map.put("totalAmount", b.totalAmount);
            map.put("discountAmount", b.discountAmount);
            map.put("finalAmount", b.finalAmount);
            map.put("paymentMethod", b.paymentMethod);
            map.put("createdAt", b.createdAt);
            map.put("paidAt", b.paidAt);
            map.put("movieTitle", (movie != null) ? movie.title : "Unknown Movie");
            map.put("posterUrl", (movie != null) ? movie.posterUrl : "");
            map.put("cinemaName", (cinema != null) ? cinema.name : "Unknown Cinema");
            map.put("cinemaCity", (cinema != null) ? cinema.city : "");
            map.put("studioName", (studio != null) ? studio.name : "");
            map.put("startTime", st.startTime);
            map.put("format", st.format);

            List<Map<String, Object>> ticketList = new ArrayList<>();
            for (Ticket t : tickets) {
                Map<String, Object> tm = new HashMap<>();
                tm.put("ticketId", t.id);
                tm.put("ticketCode", t.ticketCode);
                tm.put("seatLabel", t.seatLabel);
                tm.put("qrCodeValue", t.qrCodeValue);
                tm.put("status", t.status);
                tm.put("usedAt", t.usedAt);
                ticketList.add(tm);
            }
            map.put("tickets", ticketList);
            result.add(map);
        }

        LOG.infof("Fetched My Tickets for userId=%d. Found %d paid bookings with tickets.", userId, result.size());
        return result;
    }

    @Transactional
    public synchronized Map<String, Object> validateTicket(String qrCodeValue) {
        Ticket ticket = Ticket.findByQrCode(qrCodeValue);
        if (ticket == null) {
            throw new IllegalArgumentException("Tiket dengan kode QR tersebut tidak ditemukan!");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("ticketCode", ticket.ticketCode);
        response.put("seatLabel", ticket.seatLabel);
        
        Booking booking = Booking.findById(ticket.bookingId);
        if (booking != null) {
            Showtime st = Showtime.findById(booking.showtimeId);
            if (st != null) {
                Movie movie = Movie.findById(st.movieId);
                if (movie != null) response.put("movieTitle", movie.title);
                response.put("startTime", st.startTime);
            }
        }

        if ("USED".equals(ticket.status)) {
            response.put("status", "FAILED");
            response.put("message", "WARNING: Tiket ini SUDAH DIGUNAKAN sebelumnya pada " + ticket.usedAt);
            return response;
        }

        if (!"VALID".equals(ticket.status)) {
            response.put("status", "FAILED");
            response.put("message", "Tiket tidak valid. Status tiket: " + ticket.status);
            return response;
        }

        ticket.status = "USED";
        ticket.usedAt = Instant.now();
        ticket.persist();

        response.put("status", "SUCCESS");
        response.put("message", "Tiket VALID! Silakan masuk ke studio.");
        response.put("checkedInAt", ticket.usedAt);
        return response;
    }
}
