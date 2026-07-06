package com.movietickets.service;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@RegisterRestClient(configKey = "midtrans-snap-api")
@Path("/snap/v1")
public interface MidtransSnapClient {

    @POST
    @Path("/transactions")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    Map<String, Object> createTransaction(
        @HeaderParam("Authorization") String authorizationHeader,
        Map<String, Object> payload
    );
}
