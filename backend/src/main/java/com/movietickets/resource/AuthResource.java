package com.movietickets.resource;

import com.movietickets.entity.User;
import com.movietickets.service.AuthService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    public static class RegisterRequest {
        public String name;
        public String email;
        public String phone;
        public String password;
        public String birthDate; // YYYY-MM-DD
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    @POST
    @Path("/register")
    public Response register(RegisterRequest req) {
        try {
            if (req.name == null || req.email == null || req.password == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Nama, email, dan password wajib diisi!")).build();
            }
            LocalDate bd = (req.birthDate != null && !req.birthDate.isEmpty()) ? LocalDate.parse(req.birthDate) : LocalDate.of(2000, 1, 1);
            Map<String, Object> res = authService.register(req.name, req.email, req.phone, req.password, bd);
            return Response.ok(res).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            String msg = e.getMessage() + (e.getCause() != null ? " - Cause: " + e.getCause().getMessage() : "");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Gagal mendaftar: " + msg)).build();
        }
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest req) {
        try {
            if (req.email == null || req.password == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Email dan password wajib diisi!")).build();
            }
            Map<String, Object> res = authService.login(req.email, req.password);
            return Response.ok(res).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            String msg = e.getMessage() + (e.getCause() != null ? " - Cause: " + e.getCause().getMessage() : "");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("error", "Gagal login: " + msg)).build();
        }
    }

    @GET
    @Path("/me")
    @Authenticated
    public Response getMe(@Context SecurityContext sec) {
        String email = sec.getUserPrincipal().getName();
        User user = authService.getProfile(email);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Pengguna tidak ditemukan!")).build();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.id);
        map.put("name", user.name);
        map.put("email", user.email);
        map.put("phone", user.phone);
        map.put("role", user.role);
        map.put("birthDate", user.birthDate);
        return Response.ok(map).build();
    }
}
