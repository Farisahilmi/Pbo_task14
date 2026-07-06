package com.movietickets.resource;

import com.movietickets.entity.User;
import com.movietickets.service.TicketService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;
import java.util.Map;

@Path("/api/v1/tickets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TicketResource {

    @Inject
    TicketService ticketService;

    @Inject
    org.eclipse.microprofile.jwt.JsonWebToken jwt;

    public static class ValidateRequest {
        public String qrCodeValue;
    }

    @GET
    @Path("/my-tickets")
    public Response getMyTickets(@Context SecurityContext sec, @QueryParam("userId") Long paramUserId) {
        Long uid = getUserIdOrDefault(sec, paramUserId);
        List<Map<String, Object>> list = ticketService.getMyTickets(uid);
        return Response.ok(list).build();
    }

    @POST
    @Path("/validate")
    public Response validateTicket(ValidateRequest req) {
        try {
            if (req == null || req.qrCodeValue == null || req.qrCodeValue.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Kode QR tidak boleh kosong!")).build();
            }
            Map<String, Object> res = ticketService.validateTicket(req.qrCodeValue.trim());
            return Response.ok(res).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("status", "FAILED", "message", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("status", "FAILED", "message", "Gagal memvalidasi tiket: " + e.getMessage())).build();
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
