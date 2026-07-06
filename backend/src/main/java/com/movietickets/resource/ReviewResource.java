package com.movietickets.resource;

import com.movietickets.entity.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Path("/api/v1/movies/{movieId}/reviews")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReviewResource {

    private static final Logger LOG = Logger.getLogger(ReviewResource.class);

    @Inject
    JsonWebToken jwt;

    public static class ReviewRequest {
        public Integer rating;
        public String comment;
        public Long userId; // Fallback
    }

    /**
     * GET /api/v1/movies/{movieId}/reviews
     * Get all reviews for a movie, enriched with user info
     */
    @GET
    public Response getReviews(@PathParam("movieId") Long movieId) {
        try {
            List<Review> reviews = Review.findByMovie(movieId);
            List<Map<String, Object>> enriched = reviews.stream().map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.id);
                m.put("userId", r.userId);
                m.put("movieId", r.movieId);
                m.put("rating", r.rating);
                m.put("comment", r.comment);
                m.put("createdAt", r.createdAt);
                // Enrich with user name
                User user = User.findById(r.userId);
                m.put("userName", user != null ? user.name : "Pengguna");
                m.put("userAvatar", user != null ? user.avatarUrl : null);
                return m;
            }).collect(Collectors.toList());

            // Calculate average
            Double avg = Review.averageRatingByMovie(movieId);
            long count = Review.countByMovie(movieId);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("reviews", enriched);
            resp.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            resp.put("totalReviews", count);

            return Response.ok(resp).build();
        } catch (Exception e) {
            LOG.error("Error fetching reviews", e);
            return Response.serverError().entity(Map.of("error", e.getMessage())).build();
        }
    }

    /**
     * POST /api/v1/movies/{movieId}/reviews
     * Submit or update a review (one per user per movie)
     */
    @POST
    @Transactional
    public Response submitReview(@PathParam("movieId") Long movieId,
                                 ReviewRequest req,
                                 @Context SecurityContext sec) {
        try {
            Long uid = resolveUserId(sec, req.userId);
            if (uid == null || uid <= 0) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Silakan login untuk memberikan ulasan")).build();
            }
            if (req.rating == null || req.rating < 1 || req.rating > 5) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Rating harus antara 1 sampai 5")).build();
            }

            // Upsert: if user already reviewed this movie, update
            Review existing = Review.findByUserAndMovie(uid, movieId);
            if (existing != null) {
                existing.rating = req.rating;
                existing.comment = req.comment;
                existing.createdAt = Instant.now();
                existing.persist();
                return Response.ok(Map.of("status", "UPDATED", "message", "Ulasan berhasil diperbarui!")).build();
            }

            Review review = new Review();
            review.userId = uid;
            review.movieId = movieId;
            review.rating = req.rating;
            review.comment = req.comment;
            review.persist();

            return Response.status(Response.Status.CREATED)
                    .entity(Map.of("status", "CREATED", "message", "Ulasan berhasil dikirim!")).build();
        } catch (Exception e) {
            LOG.error("Error submitting review", e);
            return Response.serverError().entity(Map.of("error", e.getMessage())).build();
        }
    }

    /**
     * GET /api/v1/movies/{movieId}/reviews/my-review?userId=X
     * Check if current user already reviewed this movie
     */
    @GET
    @Path("/my-review")
    public Response getMyReview(@PathParam("movieId") Long movieId,
                                @QueryParam("userId") Long paramUserId,
                                @Context SecurityContext sec) {
        Long uid = resolveUserId(sec, paramUserId);
        if (uid == null) return Response.ok(Map.of("hasReviewed", false)).build();

        Review r = Review.findByUserAndMovie(uid, movieId);
        if (r == null) return Response.ok(Map.of("hasReviewed", false)).build();

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("hasReviewed", true);
        resp.put("rating", r.rating);
        resp.put("comment", r.comment);
        return Response.ok(resp).build();
    }

    private Long resolveUserId(SecurityContext sec, Long fallback) {
        if (jwt != null && jwt.containsClaim("userId")) {
            try {
                Object val = jwt.getClaim("userId");
                if (val != null) return Long.parseLong(val.toString());
            } catch (Exception ignored) {}
        }
        if (sec != null && sec.getUserPrincipal() != null) {
            try { return Long.parseLong(sec.getUserPrincipal().getName()); } catch (Exception ignored) {}
            User u = User.findByEmail(sec.getUserPrincipal().getName());
            if (u != null) return u.id;
        }
        return fallback;
    }
}
