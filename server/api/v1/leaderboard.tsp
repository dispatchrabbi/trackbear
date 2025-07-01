import "@typespec/http";
using Http;
namespace TrackBear;

@route("/leaderboard")
@tag("Leaderboards")
namespace Leaderboards {
  @route("")
  @summary("List leaderboards")
  @get
  op list(): Success<OkResponse, LeaderboardSummary[]>;

  @route("/{uuid}")
  @summary("Get a leaderboard")
  @get
  op getByUuid(@path uuid: uuid): Success<OkResponse, Leaderboard>;

  @route("/joincode/{joincode}")
  @summary("Get a leaderboard by join code")
  @errorsDoc("Returns 409 if the requested leaderboard is not currently joinable.")
  @get
  op getByJoinCode(@path joincode: string): Success<OkResponse, Leaderboard> | Failure<
    ConflictResponse,
    "CANNOT_JOIN"
  >;

  @route("")
  @summary("Create a leaderboard")
  @post
  op create(@body payload: CreateLeaderboardPayload): Success<CreatedResponse, Leaderboard>;

  @route("/{uuid}")
  @summary("Update a leaderboard")
  @patch(#{ implicitOptionality: true })
  op update(@path uuid: uuid, @body payload: UpdateLeaderboardPayload): Success<
    OkResponse,
    Leaderboard
  >;

  @route("/{uuid}/star")
  @summary("Star or unstar a leaderboard")
  @patch(#{ implicitOptionality: false })
  op star(@path uuid: uuid, @body payload: Starred): Success<OkResponse, Starred>;

  @route("/{uuid}")
  @summary("Delete a leaderboard")
  @delete
  op delete(@path uuid: uuid): Success<OkResponse, Leaderboard>;

  @route("/{uuid}/participants")
  @summary("List leaderboard participants")
  @doc("Lists the participants of a leaderboard and relevant tallies.")
  @get
  op listParticipants(@path uuid: uuid): Success<OkResponse, Participant[]>;

  @route("/{uuid}/members")
  @summary("List leaderboard members")
  @doc("Lists members of the leaderboard as leaderboard owners see them.")
  @get
  op listMembers(@path uuid: uuid): Success<OkResponse, Membership[]>;

  @route("/{uuid}/members/{memberId}")
  @summary("Update a leaderboard member")
  @patch(#{ implicitOptionality: true })
  op updateMember(@path uuid: uuid, @path memberId: id, @body payload: UpdateMember): Success<
    OkResponse,
    Membership
  >;

  @route("/{uuid}/members/{memberId}")
  @summary("Remove a leaderboard member")
  @errorsDoc("Returns 409 if the member being removed is the only owner of the leaderboard.")
  @delete
  op removeMember(@path uuid: uuid, @path memberId: id): Success<OkResponse, Membership> | Failure<
    ConflictResponse,
    "ONLY_OWNER"
  >;

  @route("/{uuid}/me")
  @summary("Get your participation")
  @get
  op getMyParticipation(@path uuid: uuid): Success<OkResponse, Participation>;

  @route("/{uuid}/me")
  @summary("Join a leaderboard")
  @errorsDoc("Returns 409 if the requested leaderboard is not currently joinable or if you have already joined.")
  @post
  op joinBoard(@path uuid: uuid, @body payload: UpdateParticipation): Success<
    OkResponse,
    Member
  > | Failure<ConflictResponse, "CANNOT_JOIN" | "ALREADY_JOINED">;

  @route("/{uuid}/me")
  @summary("Update your participation")
  @patch(#{ implicitOptionality: false })
  op updateMyParticipation(@path uuid: uuid, @body payload: UpdateParticipation): Success<
    OkResponse,
    Member
  >;

  @route("/{uuid}/me")
  @summary("Leave a leaderboard")
  @errorsDoc("Returns 409 if you are the only owner of the leaderboard.")
  @delete
  op leaveBoard(@path uuid: uuid): Success<OkResponse, Member> | Failure<
    ConflictResponse,
    "ONLY_OWNER"
  >;

  model Leaderboard {
    ...DbProps;
    ...StateProps<LeaderboardState>;
    ...OwnerProps;
    title: string;
    description: string;
    startDate: plaindate | null;
    endDate: plaindate | null;
    individualGoalMode: boolean;
    fundraiserMode: boolean;
    measures: TallyMeasure[];
    goal: MeasureCounts | null;
    isJoinable: boolean;

    @invisible(Lifecycle)
    isPublic: boolean;

    ...StarredProps;
  }

  model LeaderboardSummary extends Leaderboard {
    members: MemberBio[];
  }
  alias MemberBio = {
    ...PickProperties<Member, "id" | "isParticipant" | "isOwner" | "displayName" | "avatar">;
    userUuid: uuid;
  };

  model CreateLeaderboardPayload is Create<Leaderboard>;
  model UpdateLeaderboardPayload is Update<Leaderboard>;

  model Participant {
    ...PickProperties<Member, "id" | "uuid" | "goal" | "avatar" | "displayName">;
    tallies: LeaderboardTally[];
  }

  model Participation
    is PickProperties<Member, "id" | "goal" | "isParticipant" | "workIds" | "tagIds">;

  model Membership
    is PickProperties<
      Member,
      "id" | "uuid" | "state" | "avatar" | "displayName" | "isOwner" | "isParticipant"
    >;

  model LeaderboardTally is PickProperties<Tallies.Tally, "uuid" | "date" | "measure" | "count">;

  model Member {
    ...DbProps;
    userId: id;
    boardId: id;
    state: LeaderboardParticipantState;
    displayName: string;
    avatar: string | null;
    isParticipant: boolean;
    isOwner: boolean;
    goal: ParticipantGoal | null;
    workIds: id[];
    tagIds: id[];
  }

  model ParticipantGoal {
    measure: TallyMeasure;
    count: int32;
  }

  enum LeaderboardState {
    active: "active",
    deleted: "deleted",
  }

  enum LeaderboardParticipantState {
    active: "active",
    // banned: "banned",
  }

  model Starred {
    starred: boolean;
  }

  model UpdateMember is OptionalProperties<PickProperties<Membership, "isOwner">>;

  model UpdateParticipation is Update<Participation>;
}
