package com.movietickets.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import java.util.Map;

@Path("/")
@RegisterRestClient(configKey = "tmdb-api")
public interface TmdbRestClient {

    /**
     * Discover movies — used for NOW_SHOWING:
     * filter by primary_release_date.gte / lte, sort by popularity.desc
     */
    @GET
    @Path("discover/movie")
    Map<String, Object> discoverMovies(
            @QueryParam("api_key") String apiKey,
            @QueryParam("primary_release_date.gte") String dateGte,
            @QueryParam("primary_release_date.lte") String dateLte,
            @QueryParam("sort_by") String sortBy,
            @QueryParam("with_original_language") String language,
            @QueryParam("page") int page
    );

    /**
     * Upcoming movies — used for COMING_SOON:
     * returns films with future release dates in a specified region
     */
    @GET
    @Path("movie/upcoming")
    Map<String, Object> getUpcomingMovies(
            @QueryParam("api_key") String apiKey,
            @QueryParam("region") String region,
            @QueryParam("page") int page
    );

    /**
     * Movie detail — used to get runtime (duration_minutes)
     */
    @GET
    @Path("movie/{movie_id}")
    Map<String, Object> getMovieDetails(
            @PathParam("movie_id") long movieId,
            @QueryParam("api_key") String apiKey
    );

    /**
     * Movie videos — used to get the official YouTube trailer key
     * Filter: type="Trailer" AND site="YouTube" AND official=true (preferred)
     */
    @GET
    @Path("movie/{movie_id}/videos")
    Map<String, Object> getMovieVideos(
            @PathParam("movie_id") long movieId,
            @QueryParam("api_key") String apiKey
    );

    /**
     * Movie release dates — used for age rating (certification)
     * Filter region "ID" (LSF Indonesia) → fallback to "US" (MPAA)
     */
    @GET
    @Path("movie/{movie_id}/release_dates")
    Map<String, Object> getMovieReleaseDates(
            @PathParam("movie_id") long movieId,
            @QueryParam("api_key") String apiKey
    );

    /**
     * Genre list — maps genre_id integers to human-readable names
     */
    @GET
    @Path("genre/movie/list")
    Map<String, Object> getGenres(
            @QueryParam("api_key") String apiKey
    );
}
