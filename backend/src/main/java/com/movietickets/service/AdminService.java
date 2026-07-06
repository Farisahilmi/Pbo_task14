package com.movietickets.service;

import com.movietickets.entity.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class AdminService {

    @Transactional
    public Movie saveMovie(Movie movie) {
        if (movie.id == null) {
            movie.persist();
        } else {
            Movie existing = Movie.findById(movie.id);
            if (existing != null) {
                existing.title = movie.title;
                existing.synopsis = movie.synopsis;
                existing.genre = movie.genre;
                existing.durationMinutes = movie.durationMinutes;
                existing.ageRating = movie.ageRating;
                existing.language = movie.language;
                existing.posterUrl = movie.posterUrl;
                existing.trailerUrl = movie.trailerUrl;
                existing.releaseDate = movie.releaseDate;
                existing.status = movie.status;
                existing.persist();
            }
        }
        return movie;
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie.deleteById(id);
    }

    @Transactional
    public Cinema saveCinema(Cinema cinema) {
        if (cinema.id == null) cinema.persist();
        else {
            Cinema existing = Cinema.findById(cinema.id);
            if (existing != null) {
                existing.name = cinema.name;
                existing.city = cinema.city;
                existing.address = cinema.address;
                existing.facilities = cinema.facilities;
                existing.persist();
            }
        }
        return cinema;
    }

    @Transactional
    public Studio saveStudio(Studio studio) {
        if (studio.id == null) {
            studio.persist();
            // Automatically create seats based on capacity (default grid 8 rows x 10 cols)
            createDefaultSeatsForStudio(studio);
        } else {
            Studio existing = Studio.findById(studio.id);
            if (existing != null) {
                existing.name = studio.name;
                existing.capacity = studio.capacity;
                existing.persist();
            }
        }
        return studio;
    }

    private void createDefaultSeatsForStudio(Studio studio) {
        int rows = 8;
        int cols = (studio.capacity != null && studio.capacity > 0) ? (studio.capacity / rows) : 10;
        char[] rowLabels = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'};

        for (int r = 0; r < rows && r < rowLabels.length; r++) {
            for (int c = 1; c <= cols; c++) {
                Seat seat = new Seat();
                seat.studioId = studio.id;
                seat.rowLabel = String.valueOf(rowLabels[r]);
                seat.seatNumber = c;
                if (r >= rows - 2) {
                    seat.seatType = "PREMIUM";
                } else if (r == rows - 1) {
                    seat.seatType = "COUPLE";
                } else {
                    seat.seatType = "REGULAR";
                }
                seat.persist();
            }
        }
    }

    @Transactional
    public Showtime saveShowtime(Showtime st) {
        if (st.id == null) st.persist();
        else {
            Showtime existing = Showtime.findById(st.id);
            if (existing != null) {
                existing.movieId = st.movieId;
                existing.studioId = st.studioId;
                existing.startTime = st.startTime;
                existing.endTime = st.endTime;
                existing.basePriceRegular = st.basePriceRegular;
                existing.basePricePremium = st.basePricePremium;
                existing.basePriceCouple = st.basePriceCouple;
                existing.format = st.format;
                existing.persist();
            }
        }
        return st;
    }

    @Transactional
    public Promo savePromo(Promo promo) {
        if (promo.id == null) promo.persist();
        else {
            Promo existing = Promo.findById(promo.id);
            if (existing != null) {
                existing.code = promo.code;
                existing.discountType = promo.discountType;
                existing.discountValue = promo.discountValue;
                existing.quota = promo.quota;
                existing.validFrom = promo.validFrom;
                existing.validTo = promo.validTo;
                existing.persist();
            }
        }
        return promo;
    }

    public Map<String, Object> getDashboardAnalytics() {
        List<Booking> paidBookings = Booking.list("status", "PAID");
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalTicketsSold = 0;

        Map<Long, Long> ticketsPerMovie = new HashMap<>();
        Map<Long, BigDecimal> revenuePerMovie = new HashMap<>();

        for (Booking b : paidBookings) {
            totalRevenue = totalRevenue.add(b.finalAmount);
            List<BookingSeat> bSeats = BookingSeat.findByBooking(b.id);
            totalTicketsSold += bSeats.size();

            Showtime st = Showtime.findById(b.showtimeId);
            if (st != null) {
                ticketsPerMovie.put(st.movieId, ticketsPerMovie.getOrDefault(st.movieId, 0L) + bSeats.size());
                revenuePerMovie.put(st.movieId, revenuePerMovie.getOrDefault(st.movieId, BigDecimal.ZERO).add(b.finalAmount));
            }
        }

        long totalSeatsAvailable = Seat.count();
        long totalShowtimes = Showtime.count();
        long totalCapacity = totalSeatsAvailable * Math.max(1, totalShowtimes);
        double occupancyRate = (totalCapacity > 0) ? ((double) totalTicketsSold / totalCapacity) * 100.0 : 0.0;

        List<Map<String, Object>> movieStats = new ArrayList<>();
        for (Movie m : Movie.<Movie>listAll()) {
            Map<String, Object> ms = new HashMap<>();
            ms.put("movieId", m.id);
            ms.put("title", m.title);
            ms.put("ticketsSold", ticketsPerMovie.getOrDefault(m.id, 0L));
            ms.put("revenue", revenuePerMovie.getOrDefault(m.id, BigDecimal.ZERO));
            movieStats.add(ms);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalRevenue", totalRevenue);
        analytics.put("totalTicketsSold", totalTicketsSold);
        analytics.put("occupancyRate", Math.round(occupancyRate * 100.0) / 100.0);
        analytics.put("totalMovies", Movie.count());
        analytics.put("totalCinemas", Cinema.count());
        analytics.put("totalPromos", Promo.count());
        analytics.put("movieStats", movieStats);
        return analytics;
    }
}
