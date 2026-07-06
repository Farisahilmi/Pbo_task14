package com.movietickets.resource;

import com.movietickets.entity.Booking;
import com.movietickets.entity.User;
import com.movietickets.service.BookingService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;
import java.util.Map;

@Path("/api/v1/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    BookingService bookingService;

    @Inject
    org.eclipse.microprofile.jwt.JsonWebToken jwt;

    public static class LockRequest {
        public Long showtimeId;
        public List<Long> seatIds;
        public Long userId; // Optional fallback for guest testing
    }

    public static class CreateBookingRequest {
        public String lockSessionId;
        public Long showtimeId;
        public List<Long> seatIds;
        public String promoCode;
        public String paymentMethod;
        public Long userId;
    }

    @POST
    @Path("/lock-seats")
    public Response lockSeats(LockRequest req, @Context SecurityContext sec) {
        try {
            Long uid = getUserIdOrDefault(sec, req.userId);
            Map<String, Object> res = bookingService.lockSeats(req.showtimeId, req.seatIds, uid);
            return Response.ok(res).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Gagal mengunci kursi: " + e.getMessage())).build();
        }
    }

    @POST
    public Response createBooking(CreateBookingRequest req, @Context SecurityContext sec) {
        try {
            Long uid = getUserIdOrDefault(sec, req.userId);
            Booking booking = bookingService.createBooking(req.lockSessionId, req.showtimeId, req.seatIds, req.promoCode, req.paymentMethod, uid);
            return Response.status(Response.Status.CREATED).entity(booking).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Gagal membuat pesanan: " + e.getMessage())).build();
        }
    }

    @GET
    @Path("/my-bookings")
    public Response getMyBookings(@Context SecurityContext sec, @QueryParam("userId") Long paramUserId) {
        Long uid = getUserIdOrDefault(sec, paramUserId);
        List<Booking> list = Booking.findByUser(uid);
        return Response.ok(list).build();
    }

    @DELETE
    @Path("/{id}")
    public Response cancelBooking(@PathParam("id") Long id, @Context SecurityContext sec, @QueryParam("userId") Long paramUserId) {
        try {
            Long uid = getUserIdOrDefault(sec, paramUserId);
            bookingService.cancelBooking(id, uid);
            return Response.ok(Map.of("status", "CANCELLED", "message", "Pesanan berhasil dibatalkan")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        }
    }

    private Long getUserIdOrDefault(SecurityContext sec, Long paramUserId) {
        if (jwt != null && jwt.containsClaim("userId")) {
            try {
                Object claimVal = jwt.getClaim("userId");
                if (claimVal != null) return Long.parseLong(claimVal.toString());
            } catch (Exception ignored) {}
        }
        if (sec != null && sec.getUserPrincipal() != null) {
            String principalName = sec.getUserPrincipal().getName();
            try {
                return Long.parseLong(principalName);
            } catch (Exception ignored) {}
            User u = User.findByEmail(principalName);
            if (u != null && u.id != null) {
                return u.id;
            }
        }
        if (paramUserId != null && paramUserId > 0) return paramUserId;
        return 3L; // Default customer demo Budi Santoso (id = 3) for zero-setup ease
    }
}
