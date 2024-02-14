# v1 API

The v1 version of the API was started with the tag-and-tally rewrite. It'll eventually encompass things like auth and user info, but for now it's just for the new data models.

Conventions for v1:
- The filenames and paths are all in the singular
- Generally, on a path:
  - `GET /` lists all of the relevant entities
  - `GET /:id` gets the entity with that ID
  - `POST /` creates a new entity
  - `PUT /:id` updates the entity with that ID
  - `DELETE /:id` deletes the entity with that ID
- Generally, handlers should get wrapped in `h` (from server/lib/api-response.ts) so that they don't need to worry about try/catching every DB call
- There should be an exported type for each payload shape, and a zod validation schema named `z` + the name of that schema (e.g., `CreateWorkPayload` should have `zCreateWorkPayload`).
