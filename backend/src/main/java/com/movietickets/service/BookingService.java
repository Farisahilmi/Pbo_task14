package com.movietickets.service;

import com.movietickets.entity.*;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@ApplicationScoped
public class BookingService {

    private static final Logger LOG = Logger.getLogger(BookingService.class);

    // Key: "showtimeId_seatId", Value: SeatLockInfo
    private final ConcurrentHashMap<String, SeatLockInfo> activeLocks = new ConcurrentHashMap<>();

    public static class SeatLockInfo {
        public String lockSessionId;
        public Long userId;
        public Long showtimeId;
        public Long seatId;
        public Instant expiredAt;
    }

    public List<Map<String, Object>> getSeatStatuses(Long showtimeId) {
        Showtime showtime = Showtime.findById(showtimeId);
        if (showtime == null) throw new IllegalArgumentException("Jadwal tayang tidak ditemukan!");

        List<Seat> allSeats = Seat.findByStudio(showtime.studioId);
        
        // Find seats already booked (PAID or unexpired PENDING in database)
        List<Booking> activeBookings = Booking.list("showtimeId = ?1 and (status = 'PAID' or (status = 'PENDING' and expiredAt >= ?2))", showtimeId, Instant.now());
        Set<Long> bookedSeatIds = new HashSet<>();
        for (Booking b : activeBookings) {
            List<BookingSeat> bSeats = BookingSeat.findByBooking(b.id);
            for (BookingSeat bs : bSeats) {
                bookedSeatIds.add(bs.seatId);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        Instant now = Instant.now();

        for (Seat seat : allSeats) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", seat.id);
            map.put("rowLabel", seat.rowLabel);
            map.put("seatNumber", seat.seatNumber);
            map.put("seatLabel", seat.rowLabel + seat.seatNumber);
            map.put("seatType", seat.seatType);

            BigDecimal price = showtime.basePriceRegular;
            if ("PREMIUM".equalsIgnoreCase(seat.seatType)) price = showtime.basePricePremium;
            else if ("COUPLE".equalsIgnoreCase(seat.seatType)) price = showtime.basePriceCouple;
            map.put("price", price);

            String status = "AVAILABLE";
            if (bookedSeatIds.contains(seat.id)) {
                status = "BOOKED";
            } else {
                String lockKey = showtimeId + "_" + seat.id;
                SeatLockInfo lock = activeLocks.get(lockKey);
                if (lock != null && lock.expiredAt.isAfter(now)) {
                    status = "LOCKED";
                }
            }
            map.put("status", status);
            result.add(map);
        }

        return result;
    }

    public synchronized Map<String, Object> lockSeats(Long showtimeId, List<Long> seatIds, Long userId) {
        if (seatIds == null || seatIds.isEmpty()) {
            throw new IllegalArgumentException("Pilih minimal 1 kursi!");
        }
        if (seatIds.size() > 6) {
            throw new IllegalArgumentException("Maksimal pemesanan adalah 6 kursi per transaksi!");
        }

        Showtime showtime = Showtime.findById(showtimeId);
        if (showtime == null) throw new IllegalArgumentException("Jadwal tidak ditemukan!");

        Instant now = Instant.now();
        List<Booking> activeBookings = Booking.list("showtimeId = ?1 and status in ('PAID', 'PENDING')", showtimeId);
        Set<Long> bookedSeatIds = new HashSet<>();
        for (Booking b : activeBookings) {
            BookingSeat.findByBooking(b.id).forEach(bs -> bookedSeatIds.add(bs.seatId));
        }

        // Check availability and lock status
        for (Long seatId : seatIds) {
            Seat seat = Seat.findById(seatId);
            String label = (seat != null) ? (seat.rowLabel + seat.seatNumber) : String.valueOf(seatId);

            if (bookedSeatIds.contains(seatId)) {
                throw new IllegalStateException("Kursi " + label + " sudah dipesan!");
            }

            String lockKey = showtimeId + "_" + seatId;
            SeatLockInfo existingLock = activeLocks.get(lockKey);
            if (existingLock != null && existingLock.expiredAt.isAfter(now)) {
                if (!existingLock.userId.equals(userId)) {
                    throw new IllegalStateException("Kursi " + label + " sedang dikunci oleh pengguna lain!");
                }
            }
        }

        String lockSessionId = UUID.randomUUID().toString();
        Instant expiredAt = now.plus(Duration.ofMinutes(10)); // 10 minutes lock TTL

        List<Map<String, Object>> lockedSeats = new ArrayList<>();
        for (Long seatId : seatIds) {
            Seat seat = Seat.findById(seatId);
            String lockKey = showtimeId + "_" + seatId;
            
            SeatLockInfo lock = new SeatLockInfo();
            lock.lockSessionId = lockSessionId;
            lock.userId = userId;
            lock.showtimeId = showtimeId;
            lock.seatId = seatId;
            lock.expiredAt = expiredAt;
            activeLocks.put(lockKey, lock);

            Map<String, Object> sm = new HashMap<>();
            sm.put("id", seat.id);
            sm.put("label", seat.rowLabel + seat.seatNumber);
            sm.put("type", seat.seatType);
            
            BigDecimal price = showtime.basePriceRegular;
            if ("PREMIUM".equalsIgnoreCase(seat.seatType)) price = showtime.basePricePremium;
            else if ("COUPLE".equalsIgnoreCase(seat.seatType)) price = showtime.basePriceCouple;
            sm.put("price", price);
            lockedSeats.add(sm);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("lockSessionId", lockSessionId);
        response.put("showtimeId", showtimeId);
        response.put("expiredAt", expiredAt);
        response.put("lockedSeats", lockedSeats);
        return response;
    }

    @Transactional
    public synchronized Booking createBooking(String lockSessionId, Long showtimeId, List<Long> seatIds, String promoCode, String paymentMethod, Long userId) {
        if (seatIds == null || seatIds.isEmpty()) throw new IllegalArgumentException("Kursi tidak valid!");
        
        Showtime showtime = Showtime.findById(showtimeId);
        if (showtime == null) throw new IllegalArgumentException("Jadwal tidak ditemukan!");

        Instant now = Instant.now();

        // Verify lock and database ACID constraints
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Long seatId : seatIds) {
            String lockKey = showtimeId + "_" + seatId;
            SeatLockInfo lock = activeLocks.get(lockKey);
            
            if (lock == null || !lock.lockSessionId.equals(lockSessionId) || lock.expiredAt.isBefore(now)) {
                throw new IllegalStateException("Sesi penguncian kursi telah berakhir! Silakan pilih kursi kembali.");
            }

            Seat seat = Seat.findById(seatId);
            BigDecimal price = showtime.basePriceRegular;
            if ("PREMIUM".equalsIgnoreCase(seat.seatType)) price = showtime.basePricePremium;
            else if ("COUPLE".equalsIgnoreCase(seat.seatType)) price = showtime.basePriceCouple;
            
            totalAmount = totalAmount.add(price);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (promoCode != null && !promoCode.trim().isEmpty()) {
            Promo promo = Promo.findByCode(promoCode);
            if (promo != null && (promo.validTo == null || promo.validTo.isAfter(LocalDate.now())) && (promo.quota == null || promo.quota > 0)) {
                if ("PERCENTAGE".equalsIgnoreCase(promo.discountType)) {
                    discountAmount = totalAmount.multiply(promo.discountValue).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                } else {
                    discountAmount = promo.discountValue;
                }
                if (discountAmount.compareTo(totalAmount) > 0) discountAmount = totalAmount;
                
                if (promo.quota != null) {
                    promo.quota = promo.quota - 1;
                    promo.persist();
                }
            }
        }

        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        Booking booking = new Booking();
        booking.bookingCode = "TIX-" + System.currentTimeMillis() + "-" + (100 + new Random().nextInt(900));
        booking.userId = userId;
        booking.showtimeId = showtimeId;
        booking.status = "PENDING";
        booking.totalAmount = totalAmount;
        booking.discountAmount = discountAmount;
        booking.finalAmount = finalAmount;
        booking.promoCode = promoCode;
        booking.paymentMethod = paymentMethod;
        booking.createdAt = now;
        booking.expiredAt = now.plus(Duration.ofMinutes(10));
        booking.persist();

        for (Long seatId : seatIds) {
            Seat seat = Seat.findById(seatId);
            BigDecimal price = showtime.basePriceRegular;
            if ("PREMIUM".equalsIgnoreCase(seat.seatType)) price = showtime.basePricePremium;
            else if ("COUPLE".equalsIgnoreCase(seat.seatType)) price = showtime.basePriceCouple;

            BookingSeat bs = new BookingSeat();
            bs.bookingId = booking.id;
            bs.seatId = seatId;
            bs.price = price;
            bs.persist();

            // Keep in-memory lock active to shield seat during DB commit window against race conditions
            // activeLocks.remove(showtimeId + "_" + seatId);
        }

        return booking;
    }

    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null || !booking.userId.equals(userId)) {
            throw new IllegalArgumentException("Pesanan tidak ditemukan!");
        }
        if ("PENDING".equals(booking.status)) {
            booking.status = "CANCELLED";
            booking.persist();
            LOG.infof("Booking %d cancelled by user %d", bookingId, userId);
        } else if ("PAID".equals(booking.status)) {
            booking.status = "REFUNDED";
            booking.persist();
            List<Ticket> tickets = Ticket.findByBooking(bookingId);
            for (Ticket t : tickets) {
                t.status = "CANCELLED";
                t.persist();
            }
            LOG.infof("Booking %d refunded and %d tickets cancelled by user %d", bookingId, tickets.size(), userId);
        }
    }

    @Scheduled(every = "60s")
    @Transactional
    public void cleanExpiredLocksAndBookings() {
        Instant now = Instant.now();
        
        // Clean expired locks
        activeLocks.entrySet().removeIf(entry -> entry.getValue().expiredAt.isBefore(now));

        // Clean expired pending bookings
        List<Booking> expiredBookings = Booking.list("status = 'PENDING' and expiredAt < ?1", now);
        for (Booking b : expiredBookings) {
            b.status = "EXPIRED";
            b.persist();
        }
    }
}
