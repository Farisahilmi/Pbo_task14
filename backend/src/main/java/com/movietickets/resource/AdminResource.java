package com.movietickets.resource;

import com.movietickets.entity.*;
import com.movietickets.service.AdminService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/v1/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminResource {

    @Inject
    AdminService adminService;

    @Inject
    com.movietickets.service.MovieImportService movieImportService;

    @GET
    @Path("/analytics")
    public Response getAnalytics() {
        Map<String, Object> data = adminService.getDashboardAnalytics();
        return Response.ok(data).build();
    }

    // --- MOVIES ---
    @POST
    @Path("/movies")
    public Response saveMovie(Movie movie) {
        return Response.ok(adminService.saveMovie(movie)).build();
    }

    @POST
    @Path("/movies/import-tmdb")
    public Response importMoviesFromTmdb(
            @QueryParam("nowShowing") @DefaultValue("6") int nowShowing,
            @QueryParam("comingSoon") @DefaultValue("6") int comingSoon) {
        Map<String, Object> result = movieImportService.importMoviesFromTmdb(nowShowing, comingSoon);
        boolean success = "SUCCESS".equals(result.get("status"));
        return Response.status(success ? Response.Status.OK : Response.Status.INTERNAL_SERVER_ERROR)
                .entity(result).build();
    }

    @DELETE
    @Path("/movies/{id}")
    public Response deleteMovie(@PathParam("id") Long id) {
        adminService.deleteMovie(id);
        return Response.ok(Map.of("status", "DELETED")).build();
    }

    // --- CINEMAS & STUDIOS ---
    @POST
    @Path("/cinemas")
    public Response saveCinema(Cinema cinema) {
        return Response.ok(adminService.saveCinema(cinema)).build();
    }

    @POST
    @Path("/studios")
    public Response saveStudio(Studio studio) {
        return Response.ok(adminService.saveStudio(studio)).build();
    }

    // --- SHOWTIMES ---
    @POST
    @Path("/showtimes")
    public Response saveShowtime(Showtime showtime) {
        return Response.ok(adminService.saveShowtime(showtime)).build();
    }

    // --- PROMOS ---
    @POST
    @Path("/promos")
    public Response savePromo(Promo promo) {
        return Response.ok(adminService.savePromo(promo)).build();
    }
}
