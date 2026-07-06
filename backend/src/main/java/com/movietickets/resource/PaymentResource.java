package com.movietickets.resource;

import com.movietickets.service.PaymentService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/v1/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @Inject
    PaymentService paymentService;

    public static class InitiateRequest {
        public Long bookingId;
        public String paymentMethod; // QRIS, GOPAY, OVO, VA_BCA
    }

    @POST
    @Path("/initiate")
    public Response initiate(InitiateRequest req) {
        try {
            if (req.bookingId == null || req.paymentMethod == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "bookingId dan paymentMethod wajib diisi!")).build();
            }
            if ("MIDTRANS_SNAP".equalsIgnoreCase(req.paymentMethod) || "MIDTRANS".equalsIgnoreCase(req.paymentMethod)) {
                Map<String, Object> res = paymentService.initiateSnapPayment(req.bookingId);
                return Response.ok(res).build();
            }
            Map<String, Object> res = paymentService.initiatePayment(req.bookingId, req.paymentMethod);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @GET
    @Path("/{bookingId}/status")
    public Response getStatus(@PathParam("bookingId") Long bookingId) {
        try {
            Map<String, Object> res = paymentService.checkPaymentStatus(bookingId);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @POST
    @Path("/{bookingId}/confirm")
    public Response confirm(@PathParam("bookingId") Long bookingId) {
        try {
            Map<String, Object> res = paymentService.confirmPayment(bookingId);
            return Response.ok(res).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @POST
    @Path("/webhook/{provider}")
    public Response webhook(@PathParam("provider") String provider, Map<String, Object> payload) {
        try {
            if ("midtrans".equalsIgnoreCase(provider) || payload.containsKey("signature_key") || (payload.containsKey("order_id") && payload.containsKey("status_code"))) {
                try {
                    Map<String, Object> res = paymentService.processNotification(payload);
                    return Response.ok(res).build();
                } catch (SecurityException se) {
                    return Response.status(Response.Status.FORBIDDEN).entity(Map.of("status", "ERROR", "message", se.getMessage())).build();
                }
            }

            // Fallback idempotent webhook handler for generic simulation
            Object bIdObj = payload.get("bookingId");
            if (bIdObj == null) bIdObj = payload.get("order_id");
            if (bIdObj == null) bIdObj = payload.get("bookingCode");
            
            if (bIdObj != null) {
                String idStr = bIdObj.toString().trim();
                Map<String, Object> res;
                if (idStr.startsWith("TIX-") || idStr.contains("-")) {
                    res = paymentService.confirmPaymentByCode(idStr);
                } else {
                    try {
                        Long bookingId = Long.parseLong(idStr);
                        res = paymentService.confirmPayment(bookingId);
                    } catch (NumberFormatException e) {
                        res = paymentService.confirmPaymentByCode(idStr);
                    }
                }
                return Response.ok(res).build();
            }
            return Response.ok(Map.of("status", "IGNORED", "message", "No valid booking ID or order_id in webhook payload")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.OK).entity(Map.of("status", "ERROR", "message", e.getMessage())).build();
        }
    }
}
