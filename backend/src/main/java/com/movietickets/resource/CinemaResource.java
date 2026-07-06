package com.movietickets.resource;

import com.movietickets.entity.Cinema;
import com.movietickets.entity.Studio;
import com.movietickets.service.CatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/cinemas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CinemaResource {

    @Inject
    CatalogService catalogService;

    @GET
    @Path("/cities")
    public Response getAvailableCities() {
        List<String> cities = catalogService.getAvailableCities();
        return Response.ok(cities).build();
    }

    @GET
    public Response getCinemas(@QueryParam("city") String city) {
        List<Cinema> cinemas = catalogService.getCinemas(city);
        return Response.ok(cinemas).build();
    }

    @GET
    @Path("/{id}/studios")
    public Response getStudiosByCinema(@PathParam("id") Long id) {
        List<Studio> studios = catalogService.getStudiosByCinema(id);
        return Response.ok(studios).build();
    }
}
