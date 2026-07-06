package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "studios")
public class Studio extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "cinema_id", nullable = false)
    public Long cinemaId;

    @Column(nullable = false)
    public String name; // e.g. "Studio 1", "IMAX Theatre", "Premiere 1"

    @Column(name = "seat_layout_json", columnDefinition = "TEXT")
    public String seatLayoutJson; // Grid configuration

    public Integer capacity;

    public static List<Studio> findByCinema(Long cinemaId) {
        return list("cinemaId", cinemaId);
    }
}
