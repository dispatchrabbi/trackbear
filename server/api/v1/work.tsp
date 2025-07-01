import "@typespec/http";
using Http;
namespace TrackBear;

@route("/work")
@tag("Projects")
namespace Works {
  @summary("List projects")
  op list is WorkCrud.list;

  @summary("Get a project")
  op get is WorkCrud.get;

  @summary("Create a project")
  op create is WorkCrud.create;

  @summary("Update a project")
  op update is WorkCrud.update;

  @summary("Delete a project")
  op delete is WorkCrud.delete;

  @summary("Upload project cover")
  @doc("Upload a cover image for the project. Allowed formats include APNG, AVIF, GIF, JPEG, PNG, SVG, and WebP.")
  @route("/{id}/cover")
  @post
  op uploadCover(@path id: id, @body image: ImageFile): Success<OkResponse, Work>;

  @summary("Delete project cover")
  @route("/{id}/cover")
  @delete
  op deleteCover(@path id: id): Success<OkResponse, Work>;

  alias WorkCrud = Crud<
    Work,
    ListModel = SummarizedWork,
    GetModel = WorkWithTallies,
    CreatePayload = CreateWorkPayload,
    UpdatePayload = UpdateWorkPayload
  >;

  model Work {
    ...DbProps;
    ...StateProps<WorkState>;
    ...OwnerProps;
    title: string;
    description: string;
    phase: WorkPhase;
    startingBalance: MeasureCounts;

    @visibility(Lifecycle.Read)
    cover: string | null;

    ...StarredProps;
    ...ProfileProps;
  }

  model SummarizedWork extends Work {
    totals: MeasureCounts;
    lastUpdated: plaindate | null;
  }

  model WorkWithTallies extends Work {
    tallies: TallyWithTags[];
  }
  model TallyWithTags extends Tallies.Tally {
    tags: Tags.Tag[];
  }

  model CreateWorkPayload is Create<Work>;
  model UpdateWorkPayload is Update<Work>;

  enum WorkState {
    active: "active",
    deleted: "deleted",
  }

  enum WorkPhase {
    planning: "planning",
    outlining: "outlining",
    drafting: "drafting",
    revising: "revising",
    onHold: "on hold",
    finished: "finished",
    abandoned: "abandoned",
  }
}
