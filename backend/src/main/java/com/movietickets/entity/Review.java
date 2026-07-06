package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "reviews")
public class Review extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id", nullable = false)
    public Long userId;

    @Column(name = "movie_id", nullable = false)
    public Long movieId;

    @Column(nullable = false)
    public Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    public String comment;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    // Transient fields for response enrichment
    @Transient
    public String userName;

    @Transient
    public String userAvatar;

    public static List<Review> findByMovie(Long movieId) {
        return list("movieId = ?1 ORDER BY createdAt DESC", movieId);
    }

    public static Review findByUserAndMovie(Long userId, Long movieId) {
        return find("userId = ?1 AND movieId = ?2", userId, movieId).firstResult();
    }

    public static Double averageRatingByMovie(Long movieId) {
        return getEntityManager()
            .createQuery("SELECT AVG(r.rating) FROM Review r WHERE r.movieId = :movieId", Double.class)
            .setParameter("movieId", movieId)
            .getSingleResult();
    }

    public static long countByMovie(Long movieId) {
        return count("movieId", movieId);
    }
}
