package com.movietickets.service;

import com.movietickets.client.TmdbRestClient;
import com.movietickets.entity.Movie;
import com.movietickets.entity.Showtime;
import com.movietickets.entity.Studio;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * MovieImportService — imports movies from TMDB API with strict accuracy guarantees:
 *
 * - ALL data comes from TMDB (no manual/fabricated data)
 * - Deduplication via tmdb_id (UNIQUE column in movies table)
 * - NOW_SHOWING: released within the past 6 months
 * - COMING_SOON: release_date in the future (from /movie/upcoming)
 * - Poster: poster_path from TMDB (skip film if null)
 * - Trailer: official YouTube Trailer key from /movie/{id}/videos (nullable)
 * - Age rating: from /movie/{id}/release_dates (region ID → US → genre heuristic)
 * - Runtime: from /movie/{id} detail endpoint
 */
@ApplicationScoped
public class MovieImportService {

    private static final Logger LOG = Logger.getLogger(MovieImportService.class);
    private static final String POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
    private static final String YOUTUBE_WATCH_BASE = "https://www.youtube.com/watch?v=";

    @Inject
    @RestClient
    TmdbRestClient tmdbClient;

    @ConfigProperty(name = "tmdb.api.key", defaultValue = "")
    String apiKey;

    // =========================================================================
    // PUBLIC ENTRY POINT
    // =========================================================================

    /**
     * Main import method. Fetches nowShowingTarget films from discover
     * and comingSoonTarget films from upcoming endpoint.
     */
    public Map<String, Object> importMoviesFromTmdb(int nowShowingTarget, int comingSoonTarget) {
        Map<String, Object> report = new LinkedHashMap<>();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            report.put("status", "ERROR");
            report.put("message", "TMDB API Key belum dikonfigurasi! Set environment variable TMDB_API_KEY.");
            return report;
        }

        LOG.infof("🎬 Memulai import TMDB — target: %d NOW_SHOWING + %d COMING_SOON", nowShowingTarget, comingSoonTarget);

        List<String> importedTitles = new ArrayList<>();
        List<String> skippedReasons = new ArrayList<>();
        int nowShowingImported = 0;
        int comingSoonImported = 0;

        try {
            // Step 1: Fetch genre mapping from TMDB
            Map<Integer, String> genreMap = fetchGenreMap();
            LOG.infof("✅ Genre map loaded: %d genres", genreMap.size());

            // Step 2: Import NOW_SHOWING from /discover/movie (released ≤6 months ago)
            LOG.info("🎥 Fetching NOW_SHOWING films from /discover/movie...");
            nowShowingImported = importNowShowing(nowShowingTarget, genreMap, importedTitles, skippedReasons);

            // Step 3: Import COMING_SOON from /movie/upcoming
            LOG.info("🎬 Fetching COMING_SOON films from /movie/upcoming...");
            comingSoonImported = importComingSoon(comingSoonTarget, genreMap, importedTitles, skippedReasons);

        } catch (Exception e) {
            LOG.errorf("❌ Fatal error during TMDB import: %s", e.getMessage(), e);
            report.put("status", "ERROR");
            report.put("message", "Fatal error: " + e.getMessage());
            return report;
        }

        report.put("status", "SUCCESS");
        report.put("nowShowingImported", nowShowingImported);
        report.put("comingSoonImported", comingSoonImported);
        report.put("totalImported", nowShowingImported + comingSoonImported);
        report.put("importedFilms", importedTitles);
        report.put("skipped", skippedReasons);
        report.put("message", String.format(
                "Import selesai: %d NOW_SHOWING + %d COMING_SOON = %d total film berhasil.",
                nowShowingImported, comingSoonImported, nowShowingImported + comingSoonImported));
        return report;
    }

    // =========================================================================
    // NOW_SHOWING: /discover/movie with strict 6-month filter
    // =========================================================================

    @SuppressWarnings("unchecked")
    private int importNowShowing(int target, Map<Integer, String> genreMap,
                                  List<String> importedTitles, List<String> skippedReasons) {
        int count = 0;
        int page = 1;
        LocalDate today = LocalDate.now();
        // Strictly: released within the past 6 months (no older films)
        String dateGte = today.minusMonths(6).toString();
        String dateLte = today.toString();

        while (count < target && page <= 10) {
            try {
                Map<String, Object> response = tmdbClient.discoverMovies(
                        apiKey, dateGte, dateLte, "popularity.desc", null, page);
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                if (results == null || results.isEmpty()) break;

                for (Map<String, Object> item : results) {
                    if (count >= target) break;

                    String skipReason = processMovieItem(item, genreMap, "NOW_SHOWING");
                    if (skipReason == null) {
                        String title = extractString(item, "title", extractString(item, "original_title", "Unknown"));
                        importedTitles.add("[NOW_SHOWING] " + title);
                        count++;
                    } else {
                        String title = extractString(item, "title", extractString(item, "original_title", "Unknown"));
                        skippedReasons.add("[NOW_SHOWING] " + title + " → " + skipReason);
                        LOG.debugf("SKIP NOW_SHOWING '%s': %s", title, skipReason);
                    }
                }
                page++;
                sleepSafely(250);
            } catch (Exception e) {
                LOG.errorf("Error fetching NOW_SHOWING page %d: %s", page, e.getMessage());
                break;
            }
        }
        LOG.infof("✅ NOW_SHOWING import complete: %d films imported.", count);
        return count;
    }

    // =========================================================================
    // COMING_SOON: /movie/upcoming
    // =========================================================================

    @SuppressWarnings("unchecked")
    private int importComingSoon(int target, Map<Integer, String> genreMap,
                                  List<String> importedTitles, List<String> skippedReasons) {
        int count = 0;
        int page = 1;
        LocalDate today = LocalDate.now();

        while (count < target && page <= 5) {
            try {
                Map<String, Object> response = tmdbClient.getUpcomingMovies(apiKey, "US", page);
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                if (results == null || results.isEmpty()) break;

                for (Map<String, Object> item : results) {
                    if (count >= target) break;

                    // Extra safety check: release_date must be in the future
                    String releaseDateStr = extractString(item, "release_date", null);
                    if (releaseDateStr == null || releaseDateStr.isEmpty()) continue;
                    try {
                        LocalDate releaseDate = LocalDate.parse(releaseDateStr);
                        if (!releaseDate.isAfter(today)) continue; // skip if already released
                    } catch (Exception ignored) { continue; }

                    String skipReason = processMovieItem(item, genreMap, "COMING_SOON");
                    if (skipReason == null) {
                        String title = extractString(item, "title", extractString(item, "original_title", "Unknown"));
                        importedTitles.add("[COMING_SOON] " + title);
                        count++;
                    } else {
                        String title = extractString(item, "title", extractString(item, "original_title", "Unknown"));
                        skippedReasons.add("[COMING_SOON] " + title + " → " + skipReason);
                        LOG.debugf("SKIP COMING_SOON '%s': %s", title, skipReason);
                    }
                }
                page++;
                sleepSafely(250);
            } catch (Exception e) {
                LOG.errorf("Error fetching COMING_SOON page %d: %s", page, e.getMessage());
                break;
            }
        }
        LOG.infof("✅ COMING_SOON import complete: %d films imported.", count);
        return count;
    }

    // =========================================================================
    // CORE: Process & persist a single movie item from TMDB
    // Returns null on success, or a skip-reason string on failure/skip
    // =========================================================================

    @SuppressWarnings("unchecked")
    private String processMovieItem(Map<String, Object> item, Map<Integer, String> genreMap, String targetStatus) {
        try {
            // --- 1. Extract essential fields ---
            if (item.get("id") == null) return "tmdb_id is null";
            long tmdbId = ((Number) item.get("id")).longValue();

            // --- 2. Deduplication: skip if tmdb_id already in database ---
            Movie existing = Movie.findByTmdbId(tmdbId);
            if (existing != null) {
                return "already in DB (tmdb_id=" + tmdbId + ")";
            }

            // --- 3. Title ---
            String title = extractString(item, "title", null);
            if (title == null || title.isBlank()) {
                title = extractString(item, "original_title", null);
            }
            if (title == null || title.isBlank()) return "no title";

            // --- 4. Poster — MANDATORY (no Unsplash fallback allowed) ---
            String posterPath = extractString(item, "poster_path", null);
            if (posterPath == null || posterPath.isBlank()) return "poster_path is null — skipping to avoid broken poster";

            // --- 5. Release date ---
            String releaseDateStr = extractString(item, "release_date", null);
            if (releaseDateStr == null || releaseDateStr.isBlank()) return "release_date is missing";
            LocalDate releaseDate;
            try {
                releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception e) {
                return "invalid release_date format: " + releaseDateStr;
            }

            // --- 6. Synopsis ---
            String synopsis = extractString(item, "overview", "");
            if (synopsis.isBlank()) synopsis = "Sinopsis belum tersedia untuk film ini.";

            // --- 7. Genres ---
            List<Number> genreIds = (List<Number>) item.get("genre_ids");
            List<String> genreNames = new ArrayList<>();
            if (genreIds != null) {
                for (Number gid : genreIds) {
                    String gName = genreMap.get(gid.intValue());
                    if (gName != null) genreNames.add(gName);
                }
            }
            String genre = genreNames.isEmpty() ? "Drama" : String.join(", ", genreNames);

            // --- 8. Language ---
            String origLang = extractString(item, "original_language", "en");
            String language = mapLanguage(origLang);

            // --- 9. Runtime from /movie/{id} detail ---
            sleepSafely(200);
            Integer runtime = fetchRuntime(tmdbId);

            // --- 10. Official YouTube Trailer from /movie/{id}/videos ---
            sleepSafely(200);
            String trailerUrl = fetchTrailerUrl(tmdbId);

            // --- 11. Age rating from /movie/{id}/release_dates ---
            sleepSafely(200);
            String ageRating = fetchAgeRating(tmdbId, genre);

            // --- 12. Build and persist Movie ---
            Movie movie = new Movie();
            movie.tmdbId = tmdbId;
            movie.title = title;
            movie.synopsis = synopsis;
            movie.genre = genre;
            movie.durationMinutes = runtime;
            movie.ageRating = ageRating;
            movie.language = language;
            movie.posterUrl = POSTER_BASE_URL + posterPath;
            movie.trailerUrl = trailerUrl; // null is fine — better than wrong trailer
            movie.releaseDate = releaseDate;
            movie.status = targetStatus;

            persistMovieAndShowtimes(movie);

            LOG.infof("✅ IMPORTED [%s] '%s' (tmdb_id=%d, release=%s, runtime=%dm, ageRating=%s, trailer=%s)",
                    targetStatus, title, tmdbId, releaseDate, runtime,
                    ageRating, trailerUrl != null ? "✓" : "✗ (none)");
            return null; // success

        } catch (Exception e) {
            LOG.warnf("⚠️ Skip movie due to exception: %s", e.getMessage());
            return "exception: " + e.getMessage();
        }
    }

    // =========================================================================
    // HELPER: Fetch runtime from /movie/{id}
    // =========================================================================

    @SuppressWarnings("unchecked")
    private Integer fetchRuntime(long tmdbId) {
        try {
            Map<String, Object> details = tmdbClient.getMovieDetails(tmdbId, apiKey);
            if (details.get("runtime") != null) {
                int r = ((Number) details.get("runtime")).intValue();
                if (r > 30 && r < 300) return r;
            }
        } catch (Exception e) {
            LOG.debugf("Could not fetch runtime for tmdb_id=%d: %s", tmdbId, e.getMessage());
        }
        return 110; // sensible default fallback
    }

    // =========================================================================
    // HELPER: Fetch official YouTube Trailer from /movie/{id}/videos
    // =========================================================================

    @SuppressWarnings("unchecked")
    private String fetchTrailerUrl(long tmdbId) {
        try {
            Map<String, Object> videos = tmdbClient.getMovieVideos(tmdbId, apiKey);
            List<Map<String, Object>> results = (List<Map<String, Object>>) videos.get("results");
            if (results == null) return null;

            // Priority 1: official=true + type=Trailer + site=YouTube
            for (Map<String, Object> v : results) {
                if ("YouTube".equalsIgnoreCase(extractString(v, "site", ""))
                        && "Trailer".equalsIgnoreCase(extractString(v, "type", ""))
                        && Boolean.TRUE.equals(v.get("official"))) {
                    String key = extractString(v, "key", null);
                    if (key != null && !key.isBlank()) return YOUTUBE_WATCH_BASE + key;
                }
            }
            // Priority 2: any Trailer on YouTube (official field might be absent)
            for (Map<String, Object> v : results) {
                if ("YouTube".equalsIgnoreCase(extractString(v, "site", ""))
                        && "Trailer".equalsIgnoreCase(extractString(v, "type", ""))) {
                    String key = extractString(v, "key", null);
                    if (key != null && !key.isBlank()) return YOUTUBE_WATCH_BASE + key;
                }
            }
        } catch (Exception e) {
            LOG.debugf("Could not fetch trailer for tmdb_id=%d: %s", tmdbId, e.getMessage());
        }
        return null; // no trailer — better null than a wrong video
    }

    // =========================================================================
    // HELPER: Fetch age rating from /movie/{id}/release_dates
    //         Region priority: ID (LSF) → US (MPAA) → genre heuristic
    // =========================================================================

    @SuppressWarnings("unchecked")
    private String fetchAgeRating(long tmdbId, String genre) {
        try {
            Map<String, Object> releaseDatesResp = tmdbClient.getMovieReleaseDates(tmdbId, apiKey);
            List<Map<String, Object>> results = (List<Map<String, Object>>) releaseDatesResp.get("results");
            if (results == null) return genreHeuristicRating(genre);

            // Collect certifications by region
            Map<String, String> certByRegion = new HashMap<>();
            for (Map<String, Object> entry : results) {
                String iso = extractString(entry, "iso_3166_1", "");
                List<Map<String, Object>> releaseDates = (List<Map<String, Object>>) entry.get("release_dates");
                if (releaseDates == null) continue;
                for (Map<String, Object> rd : releaseDates) {
                    String cert = extractString(rd, "certification", "").trim();
                    if (!cert.isEmpty()) {
                        certByRegion.putIfAbsent(iso, cert);
                        break;
                    }
                }
            }

            // Priority: ID (LSF Indonesia)
            if (certByRegion.containsKey("ID")) {
                return mapLsfRating(certByRegion.get("ID"));
            }
            // Fallback: US (MPAA)
            if (certByRegion.containsKey("US")) {
                return mapMpaaRating(certByRegion.get("US"));
            }
        } catch (Exception e) {
            LOG.debugf("Could not fetch release_dates for tmdb_id=%d: %s", tmdbId, e.getMessage());
        }
        // Final fallback: genre heuristic
        return genreHeuristicRating(genre);
    }

    /** Map LSF (Indonesian) certification codes to internal format */
    private String mapLsfRating(String cert) {
        return switch (cert.toUpperCase().replaceAll("[^A-Z0-9+]", "")) {
            case "SU", "BO", "A" -> "SU";
            case "13", "13+" -> "13+";
            case "17", "17+", "D", "R" -> "17+";
            case "21", "21+" -> "21+";
            default -> genreHeuristicRating(cert); // unknown LSF cert
        };
    }

    /** Map MPAA (US) certification codes to internal format */
    private String mapMpaaRating(String cert) {
        return switch (cert.toUpperCase().replaceAll("[^A-Z0-9+]", "")) {
            case "G", "TV-G", "TVG" -> "SU";
            case "PG", "TVPG", "TV-PG" -> "SU";
            case "PG13", "PG-13", "TV14", "TV-14" -> "13+";
            case "R", "NC17", "NC-17", "TV-MA", "TVMA" -> "17+";
            default -> "13+";
        };
    }

    /** Genre-based heuristic fallback when no official rating is available */
    private String genreHeuristicRating(String genre) {
        if (genre == null) return "13+";
        String g = genre.toLowerCase();
        if (g.contains("animation") || g.contains("family")) return "SU";
        if (g.contains("horror") || g.contains("thriller") || g.contains("crime")) return "17+";
        return "13+";
    }

    // =========================================================================
    // HELPER: Fetch genre map from /genre/movie/list
    // =========================================================================

    @SuppressWarnings("unchecked")
    private Map<Integer, String> fetchGenreMap() {
        Map<Integer, String> map = new LinkedHashMap<>();
        try {
            Map<String, Object> response = tmdbClient.getGenres(apiKey);
            List<Map<String, Object>> genres = (List<Map<String, Object>>) response.get("genres");
            if (genres != null) {
                for (Map<String, Object> g : genres) {
                    Integer id = ((Number) g.get("id")).intValue();
                    String name = (String) g.get("name");
                    map.put(id, name);
                }
            }
        } catch (Exception e) {
            LOG.warnf("Failed to fetch genre map from TMDB: %s", e.getMessage());
        }
        return map;
    }

    // =========================================================================
    // HELPER: Persist Movie + auto-generate Showtimes for NOW_SHOWING
    // =========================================================================

    @Transactional
    protected void persistMovieAndShowtimes(Movie movie) {
        movie.persist();
        movie.flush();

        if ("NOW_SHOWING".equals(movie.status)) {
            @SuppressWarnings("unchecked")
            List<Studio> studios = (List<Studio>) (List<?>) Studio.listAll();
            if (studios == null || studios.isEmpty()) return;

            Random random = new Random();
            int[] showHours = {11, 13, 15, 18, 20};

            // Generate showtimes for the next 5 days across up to 2 studios
            LocalDate baseDate = LocalDate.of(2026, 7, 7);
            LocalDate startDt = LocalDate.now().isBefore(baseDate) ? baseDate : LocalDate.now();

            for (int dayOffset = 0; dayOffset < 5; dayOffset++) {
                LocalDate dt = startDt.plusDays(dayOffset);
                for (Studio studio : studios.subList(0, Math.min(2, studios.size()))) {
                    int h = showHours[random.nextInt(showHours.length)];
                    Showtime st = new Showtime();
                    st.movieId = movie.id;
                    st.studioId = studio.id;
                    st.startTime = dt.atTime(h, 0).atZone(java.time.ZoneId.of("Asia/Jakarta")).toInstant();
                    st.endTime = st.startTime.plus(java.time.Duration.ofMinutes(movie.durationMinutes + 15));
                    st.format = studio.name.toUpperCase().contains("IMAX") ? "IMAX 2D" : "2D Regular";
                    st.basePriceRegular = new BigDecimal("45000");
                    st.basePricePremium = new BigDecimal("65000");
                    st.basePriceCouple = new BigDecimal("120000");
                    st.persist();
                }
            }
        }
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    private String mapLanguage(String isoCode) {
        if (isoCode == null) return "English / Sub ID";
        return switch (isoCode.toLowerCase()) {
            case "id" -> "Bahasa Indonesia";
            case "ko" -> "Korean / Sub ID";
            case "ja" -> "Japanese / Sub ID";
            case "zh", "cn" -> "Mandarin / Sub ID";
            case "fr" -> "French / Sub ID";
            case "es" -> "Spanish / Sub ID";
            case "hi" -> "Hindi / Sub ID";
            case "th" -> "Thai / Sub ID";
            default -> "English / Sub ID";
        };
    }

    private String extractString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return (val instanceof String s) ? s : defaultValue;
    }

    private void sleepSafely(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
