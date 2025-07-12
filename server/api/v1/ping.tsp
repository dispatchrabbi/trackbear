import "@typespec/http";
using Http;
namespace TrackBear;

@route("/ping")
@tag("Other")
namespace Ping {
  @summary("Ping")
  @doc("This endpoint will always return 200, as a way to test API connectivity.")
  @get
  op ping(): Success<OkResponse, "ping">;

  @route("/api-token")
  @summary("Ping with API token")
  @doc("This endpoint will only return 200 when an API token is passed, as a way to test that you are using the API correctly.")
  @errorsDoc("Returns a 403 if accessed without passing an API token.")
  @get
  op apiTokenPing(): Success<OkResponse, "ping">;
}
