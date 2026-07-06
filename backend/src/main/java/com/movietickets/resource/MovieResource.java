package com.movietickets.resource;

import com.movietickets.entity.Movie;
import com.movietickets.service.CatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/movies")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MovieResource {

    @Inject
    CatalogService catalogService;

    @GET
    public Response getMovies(@QueryParam("status") String status,
                              @QueryParam("city") String city,
                              @QueryParam("genre") String genre,
                              @QueryParam("search") String search) {
        List<Movie> movies = catalogService.getMovies(status, city, genre, search);
        return Response.ok(movies).build();
    }

    @GET
    @Path("/{id}")
    public Response getMovieById(@PathParam("id") Long id) {
        Movie movie = catalogService.getMovieById(id);
        if (movie == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(movie).build();
    }
}
