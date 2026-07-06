package com.movietickets.service;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@RegisterRestClient(configKey = "midtrans-core-api")
@Path("/v2")
public interface MidtransCoreClient {

    @GET
    @Path("/{order_id}/status")
    @Produces(MediaType.APPLICATION_JSON)
    Map<String, Object> getTransactionStatus(
        @HeaderParam("Authorization") String authorizationHeader,
        @PathParam("order_id") String orderId
    );
}
