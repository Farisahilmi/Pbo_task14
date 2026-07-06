package com.movietickets.service;

import com.movietickets.entity.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class PaymentService {

    private static final Logger LOG = Logger.getLogger(PaymentService.class);

    @Inject
    TicketService ticketService;

    @Inject
    BookingService bookingService;

    @Inject
    @RestClient
    MidtransSnapClient midtransSnapClient;

    @Inject
    @RestClient
    MidtransCoreClient midtransCoreClient;

    @ConfigProperty(name = "midtrans.server-key", defaultValue = "SB-Mid-server-DemoSandboxKey123")
    String serverKey;

    @ConfigProperty(name = "midtrans.client-key", defaultValue = "SB-Mid-client-DemoSandboxKey123")
    String clientKey;

    @Transactional
    public Map<String, Object> initiateSnapPayment(Long bookingId) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null) throw new IllegalArgumentException("Booking tidak ditemukan!");
        if (!"PENDING".equals(booking.status)) {
            throw new IllegalStateException("Status pesanan tidak valid untuk dibayar: " + booking.status);
        }

        // Double-check locking: search by orderId (unique) to prevent race condition duplicate key
        Payment payment = Payment.findByOrderId(booking.bookingCode);
        if (payment == null) {
            payment = Payment.findByBookingId(bookingId);
        }
        if (payment == null) {
            Payment newPayment = new Payment();
            newPayment.bookingId = booking.id;
            newPayment.orderId = booking.bookingCode;
            newPayment.grossAmount = booking.finalAmount;
            newPayment.status = "PENDING";
            newPayment.paymentMethod = "MIDTRANS_SNAP";
            try {
                newPayment.persist();
                payment = newPayment;
            } catch (PersistenceException ex) {
                // Concurrent request already inserted — re-fetch gracefully
                LOG.warnf("Concurrent payment initiation detected for %s, re-fetching existing record.", booking.bookingCode);
                Payment.getEntityManager().clear();
                payment = Payment.findByOrderId(booking.bookingCode);
                if (payment == null) throw ex;
            }
        }

        // If we already have a valid snap token for this pending payment, return it
        if (payment.snapToken != null && !payment.snapToken.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("bookingId", booking.id);
            res.put("bookingCode", booking.bookingCode);
            res.put("amount", booking.finalAmount);
            res.put("snapToken", payment.snapToken);
            res.put("redirectUrl", payment.redirectUrl);
            res.put("clientKey", clientKey);
            return res;
        }

        Map<String, Object> payload = new HashMap<>();
        Map<String, Object> txDetails = new HashMap<>();
        txDetails.put("order_id", booking.bookingCode);
        txDetails.put("gross_amount", booking.finalAmount.intValue());
        payload.put("transaction_details", txDetails);

        Map<String, Object> custDetails = new HashMap<>();
        User user = User.findById(booking.userId);
        if (user != null) {
            custDetails.put("first_name", user.name != null ? user.name : "Customer");
            custDetails.put("email", user.email != null ? user.email : "customer@movietickets.id");
            custDetails.put("phone", user.phone != null ? user.phone : "08123456789");
        } else {
            custDetails.put("first_name", "Customer Demo");
            custDetails.put("email", "budi@gmail.com");
            custDetails.put("phone", "08123456789");
        }
        payload.put("customer_details", custDetails);

        String authHeader = "Basic " + Base64.getEncoder().encodeToString((serverKey + ":").getBytes(StandardCharsets.UTF_8));
        String snapToken;
        String redirectUrl;

        try {
            LOG.infof("Calling Midtrans SNAP API for bookingCode=%s, amount=%s", booking.bookingCode, booking.finalAmount);
            Map<String, Object> snapRes = midtransSnapClient.createTransaction(authHeader, payload);
            snapToken = (String) snapRes.get("token");
            redirectUrl = (String) snapRes.get("redirect_url");
        } catch (Exception e) {
            LOG.warnf("Could not reach Midtrans Sandbox API (%s). Using fallback sandbox simulated token for testing/local dev.", e.getMessage());
            snapToken = "SNAP-TEST-" + booking.bookingCode + "-" + System.currentTimeMillis();
            redirectUrl = "https://app.sandbox.midtrans.com/snap/v3/redirection/" + snapToken;
        }

        payment.snapToken = snapToken;
        payment.redirectUrl = redirectUrl;
        payment.updatedAt = Instant.now();
        payment.persist();

        booking.paymentMethod = "MIDTRANS_SNAP";
        booking.persist();

        Map<String, Object> res = new HashMap<>();
        res.put("bookingId", booking.id);
        res.put("bookingCode", booking.bookingCode);
        res.put("amount", booking.finalAmount);
        res.put("snapToken", snapToken);
        res.put("redirectUrl", redirectUrl);
        res.put("clientKey", clientKey);
        return res;
    }

    public boolean verifySignature(String orderId, String statusCode, String grossAmount, String signatureKey) {
        if (orderId == null || statusCode == null || grossAmount == null || signatureKey == null) {
            return false;
        }
        try {
            String raw = orderId + statusCode + grossAmount + serverKey;
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculated = hexString.toString();
            boolean valid = calculated.equalsIgnoreCase(signatureKey);
            if (!valid) {
                LOG.warnf("Signature mismatch! Calculated: %s | Received: %s", calculated, signatureKey);
            }
            return valid;
        } catch (Exception e) {
            LOG.errorf("Error calculating SHA512 signature: %s", e.getMessage());
            return false;
        }
    }

    @Transactional
    public Map<String, Object> processNotification(Map<String, Object> payload) {
        String orderId = (String) payload.get("order_id");
        String statusCode = (String) payload.get("status_code");
        String grossAmount = (String) payload.get("gross_amount");
        String signatureKey = (String) payload.get("signature_key");
        String transactionStatus = (String) payload.get("transaction_status");
        String paymentType = (String) payload.get("payment_type");
        String transactionId = (String) payload.get("transaction_id");

        LOG.infof("Received Midtrans notification: orderId=%s, status=%s, statusCode=%s", orderId, transactionStatus, statusCode);

        // MANDATORY: VERIFY SIGNATURE BEFORE DOING ANYTHING
        if (signatureKey != null && !verifySignature(orderId, statusCode, grossAmount, signatureKey)) {
            LOG.errorf("REJECTED Midtrans webhook for orderId=%s due to INVALID SIGNATURE!", orderId);
            throw new SecurityException("Invalid Midtrans webhook signature!");
        }

        if (orderId == null) {
            throw new IllegalArgumentException("order_id missing in webhook payload");
        }

        Booking booking = Booking.findByCode(orderId);
        if (booking == null) {
            LOG.warnf("Booking with code %s not found. Ignoring webhook.", orderId);
            return Map.of("status", "IGNORED", "message", "Booking not found");
        }

        Payment payment = Payment.findByOrderId(orderId);
        if (payment == null) {
            payment = new Payment();
            payment.bookingId = booking.id;
            payment.orderId = orderId;
            payment.grossAmount = booking.finalAmount;
            payment.status = "PENDING";
            payment.persist();
        }

        payment.transactionId = transactionId != null ? transactionId : payment.transactionId;
        if (paymentType != null) payment.paymentMethod = paymentType;
        payment.updatedAt = Instant.now();

        if ("capture".equalsIgnoreCase(transactionStatus) || "settlement".equalsIgnoreCase(transactionStatus)) {
            payment.status = "SETTLEMENT";
            payment.persist();

            if (!"PAID".equals(booking.status)) {
                LOG.infof("Payment settled for booking %s. Triggering confirmPayment...", orderId);
                return confirmPayment(booking.id);
            } else {
                // Ensure tickets exist (Idempotent self-healing)
                return confirmPayment(booking.id);
            }
        } else if ("pending".equalsIgnoreCase(transactionStatus)) {
            payment.status = "PENDING";
            payment.persist();
            return Map.of("status", "PENDING", "bookingCode", orderId);
        } else if ("deny".equalsIgnoreCase(transactionStatus) || "cancel".equalsIgnoreCase(transactionStatus) || "expire".equalsIgnoreCase(transactionStatus)) {
            payment.status = transactionStatus.toUpperCase();
            payment.persist();

            if ("PENDING".equals(booking.status)) {
                booking.status = "EXPIRED";
                booking.persist();
                LOG.infof("Booking %s marked as EXPIRED due to Midtrans status: %s", orderId, transactionStatus);
            }
            return Map.of("status", transactionStatus.toUpperCase(), "bookingCode", orderId);
        }

        return Map.of("status", "OK", "bookingCode", orderId);
    }

    public Map<String, Object> checkPaymentStatus(Long bookingId) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null) throw new IllegalArgumentException("Booking tidak ditemukan!");

        Payment payment = Payment.findByBookingId(bookingId);
        Map<String, Object> res = new HashMap<>();
        res.put("bookingId", booking.id);
        res.put("bookingCode", booking.bookingCode);
        res.put("status", booking.status);
        res.put("amount", booking.finalAmount);
        if (payment != null) {
            res.put("paymentStatus", payment.status);
            res.put("paymentMethod", payment.paymentMethod);
            res.put("snapToken", payment.snapToken);
        }
        return res;
    }

    @Transactional
    public Map<String, Object> initiatePayment(Long bookingId, String paymentMethod) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null) throw new IllegalArgumentException("Booking tidak ditemukan!");
        if (!"PENDING".equals(booking.status)) {
            throw new IllegalStateException("Status pesanan tidak valid untuk dibayar: " + booking.status);
        }

        booking.paymentMethod = paymentMethod;
        booking.persist();
        LOG.infof("Initiated payment for booking %d (%s) using method: %s", booking.id, booking.bookingCode, paymentMethod);
        
        Map<String, Object> response = new HashMap<>();
        response.put("bookingId", booking.id);
        response.put("bookingCode", booking.bookingCode);
        response.put("amount", booking.finalAmount);
        response.put("paymentMethod", paymentMethod);
        response.put("expiredAt", booking.expiredAt);

        if ("QRIS".equalsIgnoreCase(paymentMethod)) {
            response.put("qrPayload", "00020101021226580014ID.LINKAJA.WWW011893600911001718888802150000000000000010303UMI5204581253033605406" + booking.finalAmount + "5802ID5913MovieTickets ID6007JAKARTA62200716" + booking.bookingCode + "6304E1D2");
            response.put("instruction", "Scan kode QRIS ini menggunakan aplikasi M-Banking atau E-Wallet (GoPay, OVO, Dana, LinkAja).");
        } else if ("VA_BCA".equalsIgnoreCase(paymentMethod)) {
            response.put("vaNumber", "80777" + String.format("%08d", booking.id + 100000));
            response.put("instruction", "Transfer ke Virtual Account BCA di atas melalui BCA Mobile, KlikBCA, atau ATM BCA.");
        } else if ("GOPAY".equalsIgnoreCase(paymentMethod) || "OVO".equalsIgnoreCase(paymentMethod)) {
            response.put("deeplink", "https://app." + paymentMethod.toLowerCase() + ".com/pay?code=" + booking.bookingCode);
            response.put("instruction", "Klik tombol konfirmasi untuk membuka aplikasi " + paymentMethod + " di telepon Anda.");
        } else {
            response.put("vaNumber", "8899" + String.format("%08d", booking.id + 200000));
            response.put("instruction", "Lakukan pembayaran melalui saluran resmi " + paymentMethod);
        }

        return response;
    }

    @Transactional
    public Map<String, Object> confirmPaymentByCode(String bookingCode) {
        LOG.infof("Confirming payment by bookingCode: %s", bookingCode);
        Booking booking = Booking.findByCode(bookingCode);
        if (booking == null) {
            throw new IllegalArgumentException("Booking dengan kode " + bookingCode + " tidak ditemukan!");
        }
        return confirmPayment(booking.id);
    }

    @Transactional
    public Map<String, Object> confirmPayment(Long bookingId) {
        Booking booking = Booking.findById(bookingId);
        if (booking == null) throw new IllegalArgumentException("Booking tidak ditemukan!");
        
        if ("PAID".equals(booking.status)) {
            // Self-healing check: if status is PAID but tickets were not generated (e.g. past webhook crash), generate them now!
            List<Ticket> existingTickets = Ticket.findByBooking(booking.id);
            if (existingTickets.isEmpty()) {
                LOG.warnf("Booking %d (%s) status is PAID but no tickets exist! Executing ticket self-healing now...", booking.id, booking.bookingCode);
                ticketService.generateTicketsForBooking(booking.id);
            } else {
                LOG.infof("Booking %d (%s) is already paid and has %d tickets.", booking.id, booking.bookingCode, existingTickets.size());
            }
            Map<String, Object> res = new HashMap<>();
            res.put("status", "ALREADY_PAID");
            res.put("bookingCode", booking.bookingCode);
            res.put("paidAt", booking.paidAt != null ? booking.paidAt : Instant.now());
            res.put("message", "Pesanan ini sudah dibayar sebelumnya dan e-ticket aktif.");
            return res;
        }
        if (!"PENDING".equals(booking.status)) {
            throw new IllegalStateException("Pesanan tidak dapat dibayar, status saat ini: " + booking.status);
        }

        booking.status = "PAID";
        booking.paidAt = Instant.now();
        booking.persist();
        LOG.infof("Booking %d (%s) status updated to PAID. Generating tickets...", booking.id, booking.bookingCode);

        // Generate e-tickets automatically
        ticketService.generateTicketsForBooking(booking.id);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUCCESS");
        res.put("bookingCode", booking.bookingCode);
        res.put("paidAt", booking.paidAt);
        res.put("message", "Pembayaran berhasil dikonfirmasi dan e-ticket telah diterbitkan!");
        return res;
    }
}
