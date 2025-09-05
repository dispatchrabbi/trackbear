import "@typespec/http";
using Http;
namespace TrackBear;

@route("/project")
@tag("Projects")
namespace Projects {
  @summary("List projects")
  op list is ProjectCrud.list;

  @summary("Get a project")
  op get is ProjectCrud.get;

  @summary("Create a project")
  op create is ProjectCrud.create;

  @summary("Update a project")
  op update is ProjectCrud.update;

  @summary("Delete a project")
  op delete is ProjectCrud.delete;

  @summary("Upload project cover")
  @doc("Upload a cover image for the project. Allowed formats include APNG, AVIF, GIF, JPEG, PNG, SVG, and WebP.")
  @route("/{id}/cover")
  @post
  op uploadCover(@path id: id, @body image: ImageFile): Success<OkResponse, Project>;

  @summary("Delete project cover")
  @route("/{id}/cover")
  @delete
  op deleteCover(@path id: id): Success<OkResponse, Project>;

  alias ProjectCrud = Crud<
    Project,
    ListModel = SummarizedProject,
    GetModel = ProjectWithTallies,
    CreatePayload = CreateProjectPayload,
    UpdatePayload = UpdateProjectPayload
  >;

  model Project {
    ...DbProps;
    ...StateProps<ProjectState>;
    ...OwnerProps;
    title: string;
    description: string;
    phase: ProjectPhase;
    startingBalance: MeasureCounts;

    @visibility(Lifecycle.Read)
    cover: string | null;

    ...StarredProps;
    ...ProfileProps;
  }

  model SummarizedProject extends Project {
    totals: MeasureCounts;
    lastUpdated: plaindate | null;
  }

  model ProjectWithTallies extends Project {
    tallies: TallyWithTags[];
  }
  model TallyWithTags extends Tallies.Tally {
    tags: Tags.Tag[];
  }

  model CreateProjectPayload is Create<Project>;
  model UpdateProjectPayload is Update<Project>;

  enum ProjectState {
    active: "active",
    deleted: "deleted",
  }

  enum ProjectPhase {
    planning: "planning",
    outlining: "outlining",
    drafting: "drafting",
    revising: "revising",
    onHold: "on hold",
    finished: "finished",
    abandoned: "abandoned",
  }
}
