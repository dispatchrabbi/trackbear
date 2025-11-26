import "@typespec/http";
using Http;

namespace TrackBear;

model Success<StatusCode, Payload> {
  ...StatusCode;
  ...Body<Payload>;
}

@error
model Failure<StatusCode, FailureCode> {
  ...StatusCode;
  ...Body<{
    code: FailureCode;
    message: string;
  }>;
}

@error
model NotFoundFailure is Failure<NotFoundResponse, "NOT_FOUND">;

@error
model ServerErrorFailure is Failure<Response<500>, "SERVER_ERROR">;

model TrackBearAuthToken is ApiKeyAuth<ApiKeyLocation.header, "x-api-token">;
alias TrackBearerAuth = BearerAuth;

interface Crud<
  M extends Reflection.Model,
  GetModel extends Reflection.Model = M,
  ListModel extends Reflection.Model = GetModel,
  CreatePayload extends Reflection.Model = Create<M>,
  UpdatePayload extends Reflection.Model = Update<M>
> {
  @route("")
  @get
  list(): Success<OkResponse, ListModel[]>;

  @route("/{id}")
  @get
  get(@path id: id): Success<OkResponse, GetModel>;

  @route("")
  @post
  create(@body payload: CreatePayload): Success<CreatedResponse, GetModel>;

  @route("/{id}")
  @patch(#{ implicitOptionality: true })
  update(@path id: id, @body payload: UpdatePayload): Success<OkResponse, GetModel>;

  @route("/{id}")
  @delete
  delete(@path id: id): Success<OkResponse, GetModel>;
}

interface BatchCreate<
  M extends Reflection.Model,
  ReadModel extends Reflection.Model = M,
  BatchCreateModel extends Reflection.Model = M
> {
  @route("/batch")
  @post
  batchCreate(@body payload: BatchCreateModel[]): Success<CreatedResponse, ReadModel[]>;
}
