package com.movietickets.resource;

import com.movietickets.service.BookingService;
import com.movietickets.service.CatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
}
