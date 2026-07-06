package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"studio_id", "row_label", "seat_number"})
})
public class Seat extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "studio_id", nullable = false)
    public Long studioId;

    @Column(name = "row_label", nullable = false)
    public String rowLabel; // A, B, C...

    @Column(name = "seat_number", nullable = false)
    public Integer seatNumber; // 1, 2, 3...

    @Column(name = "seat_type", nullable = false)
    public String seatType; // REGULAR, PREMIUM, COUPLE

    public static List<Seat> findByStudio(Long studioId) {
        return list("studioId = ?1 ORDER BY rowLabel ASC, seatNumber ASC", studioId);
    }
}
