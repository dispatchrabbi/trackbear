import "@typespec/http";
using Http;

// shared field types

@secret
@format("email")
@example("grizzly@example.com")
scalar email extends string;

@example(123)
scalar id extends int32;

@secret
@minLength(8)
@example("luv5alm0n!")
scalar password extends string;

@minLength(3)
@maxLength(24)
@pattern(
  "[a-z][a-z0-9_-]+",
  "Must begin with a letter and consist only of letters, numbers, dashes, and underscores."
)
@example("grizzlybear1")
scalar username extends string;

@format("uuid")
@example("8fb3e519-fc08-477f-a70e-4132eca599d4")
scalar uuid extends string;

@format("YYYY-MM-DD")
@example("2021-03-23")
scalar plaindate extends string;

model EmptyObject {}

@summary("An image file")
@doc("Accepted formats include APNG, AVIF, GIF, JPEG, PNG, SVG, and WebP.")
model ImageFile extends File {
  contentType:
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "image/svg"
    | "image/gif"
    | "image/apng"
    | "image/apng";
  contents: bytes;
}

// shared enums and aliases

enum TallyMeasure {
  word: "word",
  time: "time",
  page: "page",
  chapter: "chapter",
  scene: "scene",
  line: "line",
}

model MeasureCounts {
  word?: uint32;
  time?: uint32;
  page?: uint32;
  chapter?: uint32;
  scene?: uint32;
  line?: uint32;
}

model User {
  ...DbProps;
  username: username;
  displayName: string;
  avatar: string | null;
  email: email;
  isEmailVerified: boolean;
}

// shared payload field collections

model DbProps {
  @visibility(Lifecycle.Read)
  @key
  id: id;

  @visibility(Lifecycle.Read)
  uuid: uuid;

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  @visibility(Lifecycle.Read)
  updatedAt: utcDateTime;
}

model StateProps<PossibleStates = string> {
  @visibility(Lifecycle.Read)
  state: PossibleStates;
}

model OwnerProps {
  @visibility(Lifecycle.Read)
  ownerId: id;
}

model StarredProps {
  starred?: boolean = false;
}

model ProfileProps {
  displayOnProfile?: boolean = false;
}
