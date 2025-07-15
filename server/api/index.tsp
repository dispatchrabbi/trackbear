import "@typespec/http";
import "@typespec/openapi";

import "./response-models.tsp";
import "./shared-models.tsp";

import "./v1/index.tsp";

using Http;
using OpenAPI;

@service(#{ title: "TrackBear" })
@server("https://trackbear.app/api/v1", "TrackBear API")
@info(#{ version: "1.0.0" })
@useAuth(TrackBearerAuth)
namespace TrackBear;
