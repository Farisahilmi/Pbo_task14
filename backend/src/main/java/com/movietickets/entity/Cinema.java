package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "cinemas")
public class Cinema extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @Column(nullable = false)
    public String city; // Jakarta, Bandung, Surabaya, Bali

    public String address;
    public Double latitude;
    public Double longitude;
    public String facilities; // IMAX, Dolby Atmos, Premier Lounge

    public static List<Cinema> findByCity(String city) {
        if (city == null || city.isEmpty() || "ALL".equalsIgnoreCase(city)) {
            return listAll();
        }
        return list("LOWER(city) = ?1", city.toLowerCase());
    }
}
