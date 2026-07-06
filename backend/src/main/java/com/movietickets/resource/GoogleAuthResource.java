package com.movietickets.resource;

import com.movietickets.service.GoogleAuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/auth/google")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GoogleAuthResource {

    private static final Logger LOG = Logger.getLogger(GoogleAuthResource.class);

    @Inject
    GoogleAuthService googleAuthService;

    @ConfigProperty(name = "google.oauth.client-id", defaultValue = "1234567890-demo-client-id.apps.googleusercontent.com")
    String clientId;

    public static class TokenVerifyRequest {
        public String credential; // Google ID Token from Google Identity Services
    }

    /**
     * 1. GET /api/v1/auth/google/login
     * Redirects browser to Google Consent Screen
     */
    @GET
    @Path("/login")
    public Response login(@QueryParam("state") String state) {
        try {
            if (state == null || state.trim().isEmpty()) {
                state = UUID.randomUUID().toString();
            }
            String url = googleAuthService.getAuthRedirectUrl(state);
            LOG.infof("Redirecting user to Google Auth Consent Screen with state: %s", state);
            return Response.seeOther(URI.create(url)).build();
        } catch (Exception e) {
            LOG.error("Failed to generate Google Auth redirect URL", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("status", "ERROR", "message", e.getMessage()))
                    .build();
        }
    }

    /**
     * 2. GET /api/v1/auth/google/callback
     * Receives authorization code from Google, exchanges for ID token, verifies user, and redirects to frontend
     */
    @GET
    @Path("/callback")
    public Response callback(@QueryParam("code") String code,
                             @QueryParam("state") String state,
                             @QueryParam("error") String error) {
        String frontendUrl = googleAuthService.getFrontendRedirectUrl();
        try {
            if (error != null && !error.isEmpty()) {
                LOG.warnf("Google OAuth callback returned error: %s", error);
                String errUrl = frontendUrl + "?error=" + URLEncoder.encode("Google Auth Dibatalkan: " + error, StandardCharsets.UTF_8);
                return Response.seeOther(URI.create(errUrl)).build();
            }

            if (code == null || code.trim().isEmpty()) {
                String errUrl = frontendUrl + "?error=" + URLEncoder.encode("Kode otorisasi tidak ditemukan", StandardCharsets.UTF_8);
                return Response.seeOther(URI.create(errUrl)).build();
            }

            // Process callback & get internal JWT
            Map<String, Object> authResult = googleAuthService.processCallback(code);

            // Construct frontend callback redirect URL with tokens and status
            StringBuilder targetUrl = new StringBuilder(frontendUrl);
            targetUrl.append("?token=").append(URLEncoder.encode(authResult.get("token").toString(), StandardCharsets.UTF_8));
            targetUrl.append("&userId=").append(authResult.get("userId"));
            targetUrl.append("&name=").append(URLEncoder.encode(authResult.get("name").toString(), StandardCharsets.UTF_8));
            targetUrl.append("&email=").append(URLEncoder.encode(authResult.get("email").toString(), StandardCharsets.UTF_8));
            targetUrl.append("&role=").append(authResult.get("role"));
            
            if (authResult.get("authStatus") != null) {
                targetUrl.append("&authStatus=").append(authResult.get("authStatus"));
            }
            if (authResult.get("message") != null) {
                targetUrl.append("&message=").append(URLEncoder.encode(authResult.get("message").toString(), StandardCharsets.UTF_8));
            }
            if (authResult.get("avatarUrl") != null) {
                targetUrl.append("&avatarUrl=").append(URLEncoder.encode(authResult.get("avatarUrl").toString(), StandardCharsets.UTF_8));
            }

            LOG.infof("Google login successful for %s. Redirecting to frontend...", authResult.get("email"));
            return Response.seeOther(URI.create(targetUrl.toString())).build();
        } catch (Exception e) {
            LOG.error("Exception in Google OAuth callback", e);
            try {
                String errUrl = frontendUrl + "?error=" + URLEncoder.encode("Gagal autentikasi Google: " + e.getMessage(), StandardCharsets.UTF_8);
                return Response.seeOther(URI.create(errUrl)).build();
            } catch (Exception ignored) {
                return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
            }
        }
    }

    /**
     * 3. POST /api/v1/auth/google/verify-token
     * Direct ID Token verification endpoint for Google Identity Services button component on frontend
     */
    @POST
    @Path("/verify-token")
    public Response verifyToken(TokenVerifyRequest req) {
        try {
            if (req == null || req.credential == null || req.credential.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("status", "ERROR", "message", "ID Token (credential) tidak boleh kosong!"))
                        .build();
            }

            Map<String, Object> authResult = googleAuthService.verifyIdTokenAndAuthenticate(req.credential.trim());
            return Response.ok(authResult).build();
        } catch (Throwable t) {
            LOG.error("Token verification failed", t);
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("status", "FAILED", "message", t.getMessage() != null ? t.getMessage() : "Gagal memverifikasi token Google"))
                    .build();
        }
    }

    /**
     * 4. GET /api/v1/auth/google/config
     * Returns Google Client ID for frontend Google Identity Services initialization
     */
    @GET
    @Path("/config")
    public Response getConfig() {
        return Response.ok(Map.of("clientId", clientId)).build();
    }
}
