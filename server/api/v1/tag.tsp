import "@typespec/http";
using Http;
namespace TrackBear;

@route("/tag")
@tag("Tags")
namespace Tags {
  @summary("List tags")
  op list is TagCrud.list;

  @summary("Get a tag")
  op get is TagCrud.get;

  // @summary("Create a tag")
  // op create is TagCrud.create;

  // @summary("Update a tag")
  // op update is TagCrud.update;

  @route("")
  @summary("Create a tag")
  @errorsDoc("Returns 400 if a tag with the given name already exists.")
  @post
  op create(@body payload: CreateTagPayload): Success<CreatedResponse, Tag> | Failure<
    BadRequestResponse,
    "ALREADY_EXISTS"
  >;

  @route("/{id}")
  @summary("Update a tag")
  @errorsDoc("Returns 400 if a tag with the given name already exists.")
  @patch(#{ implicitOptionality: true })
  op update(@path id: id, @body payload: UpdateTagPayload): Success<OkResponse, Tag> | Failure<
    BadRequestResponse,
    "ALREADY_EXISTS"
  >;

  @summary("Delete a tag")
  op delete is TagCrud.delete;

  alias TagCrud = Crud<Tag>;

  model Tag {
    ...DbProps;
    ...StateProps<TagState>;
    ...OwnerProps;
    name: string;
    color: TagColor;
  }

  model CreateTagPayload is Create<Tag>;
  model UpdateTagPayload is Update<Tag>;

  enum TagState {
    active: "active",
    deleted: "deleted",
  }

  alias TagColor =
    | "default"
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "blue"
    | "purple"
    | "brown"
    | "white"
    | "black"
    | "gray";
}
