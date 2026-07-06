package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "movies")
public class Movie extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tmdb_id", unique = true)
    public Long tmdbId; // TMDB movie ID - used for deduplication on upsert

    @Column(nullable = false)
    public String title;

    @Column(columnDefinition = "TEXT")
    public String synopsis;

    public String genre; // e.g. "Horror, Drama, Mystery"

    @Column(name = "duration_minutes")
    public Integer durationMinutes;

    @Column(name = "age_rating")
    public String ageRating; // SU, 13+, 17+, 21+

    public String language;

    @Column(name = "poster_url")
    public String posterUrl;

    @Column(name = "trailer_url")
    public String trailerUrl; // YouTube Embed URL

    @Column(name = "release_date")
    public LocalDate releaseDate;

    @Column(nullable = false)
    public String status; // NOW_SHOWING, COMING_SOON, ENDED

    @SuppressWarnings("unchecked")
    public static List<Movie> findByStatus(String status) {
        return (List<Movie>) (List<?>) list("status", status);
    }

    public static Movie findByTmdbId(Long tmdbId) {
        return find("tmdbId", tmdbId).firstResult();
    }
}
