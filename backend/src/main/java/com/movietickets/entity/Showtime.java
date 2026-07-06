package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@Entity
@Table(name = "showtimes")
public class Showtime extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "movie_id", nullable = false)
    public Long movieId;

    @Column(name = "studio_id", nullable = false)
    public Long studioId;

    @Column(name = "start_time", nullable = false)
    public Instant startTime;

    @Column(name = "end_time", nullable = false)
    public Instant endTime;

    @Column(name = "base_price_regular", nullable = false)
    public BigDecimal basePriceRegular;

    @Column(name = "base_price_premium", nullable = false)
    public BigDecimal basePricePremium;

    @Column(name = "base_price_couple", nullable = false)
    public BigDecimal basePriceCouple;

    @Column(nullable = false)
    public String format; // 2D, 3D, IMAX

    public static List<Showtime> findByMovieAndDate(Long movieId, LocalDate date) {
        if (date == null) {
            return list("movieId = ?1 ORDER BY startTime ASC", movieId);
        }
        ZoneId zone = ZoneId.of("Asia/Jakarta");
        Instant startOfDay = date.atStartOfDay(zone).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
        return list("movieId = ?1 and startTime >= ?2 and startTime <= ?3 ORDER BY startTime ASC", movieId, startOfDay, endOfDay);
    }
}
