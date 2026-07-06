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
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class TicketFlowIntegrationTest {

    @Inject
    BookingService bookingService;

    @Inject
    PaymentService paymentService;

    @Inject
    TicketService ticketService;

    @Test
    public void testEndToEndTicketFlowAndWebhookRepair() {
        // Step 1: Prepare test data (User, Cinema, Studio, Movie, Showtime, Seat)
        Long testUserId = createTestData();

        // Verify user can be looked up and has valid ID
        User user = User.findById(testUserId);
        Assertions.assertNotNull(user);
        Assertions.assertEquals("test.customer@gmail.com", user.email);

        // Step 2: Find a showtime and studio seats
        List<Showtime> showtimes = Showtime.listAll();
        Assertions.assertFalse(showtimes.isEmpty(), "Showtimes should not be empty");
        Showtime showtime = showtimes.get(0);

        List<Seat> seats = Seat.findByStudio(showtime.studioId);
        Assertions.assertTrue(seats.size() >= 4, "Studio should have at least 4 seats");
        Seat seat1 = seats.get(2); // Pick seats 2 and 3 to avoid DataSeeder's demo booking on seats 0 and 1
        Seat seat2 = seats.get(3);

        // Step 3: Lock seats and create booking for this user
        Map<String, Object> lockRes = bookingService.lockSeats(showtime.id, Arrays.asList(seat1.id, seat2.id), testUserId);
        String lockSessionId = (String) lockRes.get("lockSessionId");
        Assertions.assertNotNull(lockSessionId);

        Booking booking = bookingService.createBooking(lockSessionId, showtime.id, Arrays.asList(seat1.id, seat2.id), "PROMO10", "QRIS", testUserId);
        Assertions.assertNotNull(booking);
        Assertions.assertEquals("PENDING", booking.status);
        Assertions.assertEquals(testUserId, booking.userId);

        // Step 4: Simulate Webhook callback from payment gateway (using order_id / bookingCode)
        given()
            .contentType(ContentType.JSON)
            .body(Map.of(
                "order_id", booking.bookingCode,
                "status_code", "200",
                "transaction_status", "settlement"
            ))
        .when()
            .post("/api/v1/payments/webhook/midtrans")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"))
            .body("bookingCode", equalTo(booking.bookingCode));

        // Step 5: Assert booking status is updated to PAID in DB
        Booking updatedBooking = Booking.findById(booking.id);
        Assertions.assertEquals("PAID", updatedBooking.status);
        Assertions.assertNotNull(updatedBooking.paidAt);

        // Step 6: Assert tickets are automatically generated in DB
        List<Ticket> tickets = Ticket.findByBooking(booking.id);
        Assertions.assertEquals(2, tickets.size(), "Exactly 2 tickets should be generated for 2 booked seats");
        for (Ticket t : tickets) {
            Assertions.assertEquals("VALID", t.status);
            Assertions.assertTrue(t.ticketCode.startsWith("TKT-" + booking.bookingCode));
            Assertions.assertNotNull(t.qrCodeValue);
        }

        // Step 7: Assert tickets appear when querying 'my-tickets' endpoint for this user
        given()
            .queryParam("userId", testUserId)
        .when()
            .get("/api/v1/tickets/my-tickets")
        .then()
            .statusCode(200)
            .body("$", not(empty()))
            .body("find { it.bookingCode == '" + booking.bookingCode + "' }.status", equalTo("PAID"))
            .body("find { it.bookingCode == '" + booking.bookingCode + "' }.tickets.size()", equalTo(2));
    }

    @Transactional
    Long createTestData() {
        User u = User.findByEmail("test.customer@gmail.com");
        if (u == null) {
            u = new User();
            u.name = "Test Customer Integration";
            u.email = "test.customer@gmail.com";
            u.phone = "081234567899";
            u.passwordHash = "hash123";
            u.role = "CUSTOMER";
            u.persist();
        }
        return u.id;
    }
}
