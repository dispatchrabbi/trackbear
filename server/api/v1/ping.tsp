import "@typespec/http";
using Http;
namespace TrackBear;

@route("/ping")
@tag("Other")
namespace Ping {
  @summary("Ping")
  @get
  op ping(): Success<OkResponse, "ping">;
}
