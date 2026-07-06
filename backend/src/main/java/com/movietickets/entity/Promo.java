package com.movietickets.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promos")
public class Promo extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(unique = true, nullable = false)
    public String code;

    @Column(name = "discount_type", nullable = false)
    public String discountType; // PERCENTAGE, FIXED

    @Column(name = "discount_value", nullable = false)
    public BigDecimal discountValue;

    public Integer quota;

    @Column(name = "valid_from")
    public LocalDate validFrom;

    @Column(name = "valid_to")
    public LocalDate validTo;

    public static Promo findByCode(String code) {
        if (code == null || code.trim().isEmpty()) return null;
        return find("LOWER(code) = ?1", code.trim().toLowerCase()).firstResult();
    }
}
