import "@typespec/http";
using Http;
namespace TrackBear;

@route("/tally")
@tag("Tallies")
namespace Tallies {
  @summary("List tallies")
  @get
  op list(
    @query works?: id[],
    @query tags?: id[],
    @query measure?: TallyMeasure,
    @query startDate?: plaindate,
    @query endDate?: plaindate,
  ): Success<OkResponse, TallyWithWorkAndTags[]>;

  @summary("Get a tally")
  op get is TallyCrud.get;

  @summary("Create a tally")
  op create is TallyCrud.create;

  @summary("Create multiple tallies")
  op batchCreate is TallyBatchCreate.batchCreate;

  @summary("Update a tally")
  op update is TallyCrud.update;

  @summary("Delete a tally")
  op delete is TallyCrud.delete;

  alias TallyCrud = Crud<
    Tally,
    GetModel = TallyWithWorkAndTags,
    CreatePayload = CreateTallyPayload,
    UpdatePayload = UpdateTallyPayload
  >;
  alias TallyBatchCreate = BatchCreate<Tally, BatchCreateModel = BatchCreateTallyPayload>;

  model Tally {
    ...DbProps;
    ...StateProps;
    ...OwnerProps;
    date: plaindate;
    measure: TallyMeasure;
    count: uint32;
    note: string;
    workId: id;
  }

  model TallyWithWorkAndTags extends Tally {
    work: Projects.Project;
    tags: Tags.Tag[];
  }

  model CreateTallyPayload {
    ...Create<Tally>;
    setTotal: boolean;
    tags: string[];
  }

  model BatchCreateTallyPayload is OmitProperties<CreateTallyPayload, "setTotal">;

  model UpdateTallyPayload is OptionalProperties<CreateTallyPayload>;

  enum TallyState {
    active: "active",
    deleted: "deleted",
  }
}
