import "@typespec/http";
using Http;
namespace TrackBear;

@route("/stats")
@tag("Stats")
namespace Stats {
  @route("/days")
  @summary("List total counts per day")
  @get
  op list(@query startDate?: plaindate, @query endDate?: plaindate): Success<
    OkResponse,
    DayCount[]
  >;

  model DayCount {
    date: plaindate;
    counts: MeasureCounts;
  }
}
