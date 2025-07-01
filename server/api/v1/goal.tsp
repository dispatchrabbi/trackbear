import "@typespec/http";
using Http;
namespace TrackBear;

@route("/goal")
@tag("Goals")
namespace Goals {
  @summary("List goals")
  op list is GoalCrud.list;

  @summary("Get a goal")
  op get is GoalCrud.get;

  @summary("Create a goal")
  op create is GoalCrud.create;

  @summary("Create multiple goals")
  op batchCreate is GoalBatchCreate.batchCreate;

  @summary("Update a goal")
  op update is GoalCrud.update;

  @summary("Delete a goal")
  op delete is GoalCrud.delete;

  alias GoalCrud = Crud<
    Goal,
    GetModel = Goal,
    ListModel = GoalWithAchievement,
    CreatePayload = CreateGoalPayload,
    UpdatePayload = UpdateGoalPayload
  >;
  alias GoalBatchCreate = BatchCreate<Goal>;

  model Goal {
    ...DbProps;
    ...StateProps<GoalState>;
    ...OwnerProps;
    title: string;
    description: string;
    type: GoalType;
    parameters: GoalParameters;
    startDate: plaindate | null;
    endDate: plaindate | null;
    workIds: id[];
    tagIds: id[];
    ...StarredProps;
    ...ProfileProps;
  }

  model GoalWithAchievement {
    ...Goal;
    achieved: boolean;
  }

  model CreateGoalPayload is Create<Goal>;
  model UpdateGoalPayload is Update<Goal>;

  enum GoalState {
    active: "active",
    deleted: "deleted",
  }

  alias GoalType = "target" | "habit";

  alias GoalParameters = TargetParameters | HabitParameters;

  model TargetParameters {
    threshold: {
      measure: TallyMeasure;
      count: uint32;
    };
  }

  model HabitParameters {
    threshold: {
      measure: TallyMeasure;
      count: uint32;
    } | null;
    cadence: {
      period: uint32;
      unit: GoalCadence;
    };
  }

  enum GoalCadence {
    day: "day",
    week: "week",
    month: "month",
    year: "year",
  }
}
