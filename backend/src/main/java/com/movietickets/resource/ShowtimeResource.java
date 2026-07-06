package com.movietickets.resource;

import com.movietickets.entity.*;
import com.movietickets.service.BookingService;
import com.movietickets.service.CatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/api/v1/showtimes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShowtimeResource {

    @Inject
    CatalogService catalogService;

    @Inject
    BookingService bookingService;

    @GET
    public Response getShowtimes(@QueryParam("movieId") Long movieId,
                                 @QueryParam("cinemaId") Long cinemaId,
                                 @QueryParam("date") String dateStr) {
        if (movieId == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "movieId wajib diisi!")).build();
        }
        LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();
        List<Map<String, Object>> showtimes = catalogService.getShowtimesWithDetails(movieId, cinemaId, date);
        return Response.ok(showtimes).build();
    }

    @GET
    @Path("/{id}/seats")
    public Response getSeatStatuses(@PathParam("id") Long showtimeId) {
        try {
            List<Map<String, Object>> seats = bookingService.getSeatStatuses(showtimeId);
            return Response.ok(seats).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @GET
    @Path("/{id}")
    public Response getShowtimeById(@PathParam("id") Long showtimeId) {
        Showtime st = Showtime.findById(showtimeId);
        if (st == null) return Response.status(Response.Status.NOT_FOUND).build();

        Studio studio = Studio.findById(st.studioId);
        Cinema cinema = studio != null ? Cinema.findById(studio.cinemaId) : null;
        Movie movie = Movie.findById(st.movieId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", st.id);
        result.put("movieId", st.movieId);
        result.put("movieTitle", movie != null ? movie.title : "Film");
        result.put("moviePosterUrl", movie != null ? movie.posterUrl : null);
        result.put("studioId", st.studioId);
        result.put("studioName", studio != null ? studio.name : "-");
        result.put("cinemaId", cinema != null ? cinema.id : null);
        result.put("cinemaName", cinema != null ? cinema.name : "-");
        result.put("cinemaCity", cinema != null ? cinema.city : "-");
        result.put("startTime", st.startTime);
        result.put("endTime", st.endTime);
        result.put("format", st.format);
        result.put("basePriceRegular", st.basePriceRegular);
        result.put("basePricePremium", st.basePricePremium);
        return Response.ok(result).build();
    }
}
