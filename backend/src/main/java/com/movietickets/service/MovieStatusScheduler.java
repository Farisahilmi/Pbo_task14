package com.movietickets.service;

import com.movietickets.entity.Movie;
import com.movietickets.entity.Showtime;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@ApplicationScoped
public class MovieStatusScheduler {

    private static final Logger LOG = Logger.getLogger(MovieStatusScheduler.class);

    /**
     * Run every day at 00:01 WIB (Asia/Jakarta)
     */
    @Scheduled(cron = "0 1 0 * * ?", timeZone = "Asia/Jakarta")
    @Transactional
    public void updateMovieStatuses() {
        LOG.info("Running daily movie status update job...");
        
        ZoneId wib = ZoneId.of("Asia/Jakarta");
        LocalDate today = LocalDate.now(wib);
        Instant now = Instant.now();

        List<Movie> allMovies = Movie.listAll();
        int updatedCount = 0;

        for (Movie movie : allMovies) {
            String newStatus = movie.status;

            if (movie.releaseDate != null && movie.releaseDate.isAfter(today)) {
                newStatus = "COMING_SOON";
            } else {
                // If it's released, check if there are active showtimes from now onwards
                long activeShowtimesCount = Showtime.count("movieId = ?1 and startTime >= ?2", movie.id, now);
                if (activeShowtimesCount > 0) {
                    newStatus = "NOW_SHOWING";
                } else {
                    newStatus = "ENDED";
                }
            }

            if (!newStatus.equals(movie.status)) {
                LOG.infof("Movie %d (%s) status changed from %s to %s", movie.id, movie.title, movie.status, newStatus);
                movie.status = newStatus;
                movie.persist();
                updatedCount++;
            }
        }

        LOG.infof("Movie status update complete. Updated %d movies.", updatedCount);
    }
}
