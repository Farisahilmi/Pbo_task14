package com.movietickets;

import com.movietickets.entity.*;
import com.movietickets.service.BookingService;
import com.movietickets.service.PaymentService;
import com.movietickets.service.TicketService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class MidtransPaymentIntegrationTest {

    @Inject
    BookingService bookingService;

    @Inject
    PaymentService paymentService;

    @Inject
    TicketService ticketService;

    private String calculateSignature(String orderId, String statusCode, String grossAmount, String serverKey) throws Exception {
        String raw = orderId + statusCode + grossAmount + serverKey;
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    @Test
    public void testSnapInitiateAndWebhookLifecycle() throws Exception {
        Long testUserId = createTestData();
        List<Showtime> showtimes = Showtime.listAll();
        Showtime showtime = showtimes.get(0);
        List<Seat> seats = Seat.findByStudio(showtime.studioId);

        // Pick seats index 4 and 5 to avoid any conflicts
        Seat seat1 = seats.get(4);
        Seat seat2 = seats.get(5);

        Map<String, Object> lockRes = bookingService.lockSeats(showtime.id, Arrays.asList(seat1.id, seat2.id), testUserId);
        String lockSessionId = (String) lockRes.get("lockSessionId");

        Booking booking = bookingService.createBooking(lockSessionId, showtime.id, Arrays.asList(seat1.id, seat2.id), null, "MIDTRANS_SNAP", testUserId);
        Assertions.assertNotNull(booking);
        Assertions.assertEquals("PENDING", booking.status);

        // 1. Test POST /api/v1/payments/initiate with MIDTRANS_SNAP
        given()
            .contentType(ContentType.JSON)
            .body(Map.of("bookingId", booking.id, "paymentMethod", "MIDTRANS_SNAP"))
        .when()
            .post("/api/v1/payments/initiate")
        .then()
            .statusCode(200)
            .body("snapToken", notNullValue())
            .body("redirectUrl", notNullValue())
            .body("bookingCode", equalTo(booking.bookingCode));

        Payment payment = Payment.findByBookingId(booking.id);
        Assertions.assertNotNull(payment);
        Assertions.assertEquals("PENDING", payment.status);
        Assertions.assertNotNull(payment.snapToken);

        // 2. Test GET /api/v1/payments/{bookingId}/status
        given()
        .when()
            .get("/api/v1/payments/" + booking.id + "/status")
        .then()
            .statusCode(200)
            .body("status", equalTo("PENDING"))
            .body("paymentStatus", equalTo("PENDING"));

        // 3. Test Webhook with INVALID SIGNATURE (must be rejected with 403 Forbidden)
        given()
            .contentType(ContentType.JSON)
            .body(Map.of(
                "order_id", booking.bookingCode,
                "status_code", "200",
                "gross_amount", booking.finalAmount.toString(),
                "signature_key", "INVALID_FAKE_HASH_1234567890",
                "transaction_status", "settlement"
            ))
        .when()
            .post("/api/v1/payments/webhook/midtrans")
        .then()
            .statusCode(403)
            .body("status", equalTo("ERROR"));

        // Verify status remains PENDING in DB
        Booking checkBooking = Booking.findById(booking.id);
        Assertions.assertEquals("PENDING", checkBooking.status);

        // 4. Test Webhook with VALID SIGNATURE -> settlement
        String serverKey = "SB-Mid-server-DemoSandboxKey123"; // default test fallback
        String validSig = calculateSignature(booking.bookingCode, "200", booking.finalAmount.toString(), serverKey);

        given()
            .contentType(ContentType.JSON)
            .body(Map.of(
                "order_id", booking.bookingCode,
                "status_code", "200",
                "gross_amount", booking.finalAmount.toString(),
                "signature_key", validSig,
                "transaction_status", "settlement",
                "payment_type", "qris",
                "transaction_id", "midtrans-tx-999888"
            ))
        .when()
            .post("/api/v1/payments/webhook/midtrans")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"));

        // Assert Booking becomes PAID and Tickets are generated
        Booking.getEntityManager().clear(); // Clear L1 session cache to fetch updated data from database
        Booking paidBooking = Booking.findById(booking.id);
        Assertions.assertEquals("PAID", paidBooking.status);

        Payment paidPayment = Payment.findByBookingId(booking.id);
        Assertions.assertEquals("SETTLEMENT", paidPayment.status);
        Assertions.assertEquals("midtrans-tx-999888", paidPayment.transactionId);

        List<Ticket> tickets = Ticket.findByBooking(booking.id);
        Assertions.assertEquals(2, tickets.size());
    }

    @Test
    public void testWebhookExpireReleasesBooking() throws Exception {
        Long testUserId = createTestData();
        List<Showtime> showtimes = Showtime.listAll();
        Showtime showtime = showtimes.get(0);
        List<Seat> seats = Seat.findByStudio(showtime.studioId);

        Seat seat = seats.get(6);
        Map<String, Object> lockRes = bookingService.lockSeats(showtime.id, Arrays.asList(seat.id), testUserId);
        String lockSessionId = (String) lockRes.get("lockSessionId");

        Booking booking = bookingService.createBooking(lockSessionId, showtime.id, Arrays.asList(seat.id), null, "MIDTRANS_SNAP", testUserId);
        paymentService.initiateSnapPayment(booking.id);

        String serverKey = "SB-Mid-server-DemoSandboxKey123";
        String validSig = calculateSignature(booking.bookingCode, "202", booking.finalAmount.toString(), serverKey);

        given()
            .contentType(ContentType.JSON)
            .body(Map.of(
                "order_id", booking.bookingCode,
                "status_code", "202",
                "gross_amount", booking.finalAmount.toString(),
                "signature_key", validSig,
                "transaction_status", "expire"
            ))
        .when()
            .post("/api/v1/payments/webhook/midtrans")
        .then()
            .statusCode(200)
            .body("status", equalTo("EXPIRE"));

        Booking.getEntityManager().clear();
        Booking expiredBooking = Booking.findById(booking.id);
        Assertions.assertEquals("EXPIRED", expiredBooking.status);

        Payment expiredPayment = Payment.findByBookingId(booking.id);
        Assertions.assertEquals("EXPIRE", expiredPayment.status);
    }

    @Transactional
    Long createTestData() {
        User u = User.findByEmail("midtrans.tester@gmail.com");
        if (u == null) {
            u = new User();
            u.name = "Midtrans Tester";
            u.email = "midtrans.tester@gmail.com";
            u.phone = "081234567890";
            u.passwordHash = "hash123";
            u.role = "CUSTOMER";
            u.persist();
        }
        return u.id;
    }
}
