package com.movietickets.service;

import com.movietickets.entity.*;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class CatalogService {

    @SuppressWarnings("unchecked")
    public List<Movie> getMovies(String status, String city, String genre, String search) {
        List<Movie> movies;
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            movies = Movie.findByStatus(status);
        } else {
            movies = (List<Movie>) (List<?>) Movie.listAll();
        }

        if (genre != null && !genre.isEmpty()) {
            movies = movies.stream()
                    .filter(m -> m.genre != null && m.genre.toLowerCase().contains(genre.toLowerCase()))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            movies = movies.stream()
                    .filter(m -> m.title.toLowerCase().contains(searchLower) || 
                                 (m.genre != null && m.genre.toLowerCase().contains(searchLower)) ||
                                 (m.synopsis != null && m.synopsis.toLowerCase().contains(searchLower)))
                    .collect(Collectors.toList());
        }

        if (city != null && !city.isEmpty() && !"ALL".equalsIgnoreCase(city)) {
            // Filter movies that have showtimes in cinemas in this city
            List<Cinema> cinemasInCity = Cinema.findByCity(city);
            List<Long> cinemaIds = cinemasInCity.stream().map(c -> c.id).collect(Collectors.toList());
            List<Studio> studiosInCity = cinemaIds.isEmpty() ? List.of() : 
                    Studio.list("cinemaId in ?1", cinemaIds);
            List<Long> studioIds = studiosInCity.stream().map(s -> s.id).collect(Collectors.toList());
            
            if (!studioIds.isEmpty()) {
                List<Showtime> showtimesInCity = Showtime.list("studioId in ?1", studioIds);
                List<Long> movieIdsWithShowtimes = showtimesInCity.stream()
                        .map(st -> st.movieId)
                        .distinct()
                        .collect(Collectors.toList());
                movies = movies.stream()
                        .filter(m -> movieIdsWithShowtimes.contains(m.id))
                        .collect(Collectors.toList());
            } else {
                movies = List.of();
            }
        }

        return movies;
    }

    public List<String> getAvailableCities() {
        List<Showtime> showtimes = Showtime.list("startTime > ?1", Instant.now());
        if (showtimes.isEmpty()) return List.of();
        
        List<Long> studioIds = showtimes.stream().map(s -> s.studioId).distinct().collect(Collectors.toList());
        List<Studio> studios = Studio.list("id in ?1", studioIds);
        List<Long> cinemaIds = studios.stream().map(s -> s.cinemaId).distinct().collect(Collectors.toList());
        List<Cinema> cinemas = Cinema.list("id in ?1", cinemaIds);
        
        return cinemas.stream().map(c -> c.city).distinct().sorted().collect(Collectors.toList());
    }

    public Movie getMovieById(Long id) {
        return Movie.findById(id);
    }

    public List<Cinema> getCinemas(String city) {
        return Cinema.findByCity(city);
    }

    public List<Studio> getStudiosByCinema(Long cinemaId) {
        return Studio.findByCinema(cinemaId);
    }

    public List<Map<String, Object>> getShowtimesWithDetails(Long movieId, Long cinemaId, LocalDate date) {
        List<Showtime> showtimes = Showtime.findByMovieAndDate(movieId, date);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Showtime st : showtimes) {
            Studio studio = Studio.findById(st.studioId);
            if (studio == null) continue;
            
            if (cinemaId != null && !studio.cinemaId.equals(cinemaId)) {
                continue;
            }

            Cinema cinema = Cinema.findById(studio.cinemaId);
            if (cinema == null) continue;

            Map<String, Object> map = new HashMap<>();
            map.put("id", st.id);
            map.put("movieId", st.movieId);
            map.put("studioId", st.studioId);
            map.put("studioName", studio.name);
            map.put("cinemaId", cinema.id);
            map.put("cinemaName", cinema.name);
            map.put("cinemaCity", cinema.city);
            map.put("startTime", st.startTime);
            map.put("endTime", st.endTime);
            map.put("basePriceRegular", st.basePriceRegular);
            map.put("basePricePremium", st.basePricePremium);
            map.put("basePriceCouple", st.basePriceCouple);
            map.put("format", st.format);
            result.add(map);
        }
        return result;
    }
}
