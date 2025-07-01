# v1 API

The v1 version of the API was started with the tag-and-tally rewrite. It'll eventually encompass things like auth and user info, but for now it's just for the new data models.

Conventions for v1:
- The filenames and paths are all in the singular
- Generally, on a path:
  - `GET /` lists all of the relevant entities
  - `GET /:id` gets the entity with that ID
  - `POST /` creates a new entity
  - `PATCH /:id` updates the entity with that ID
  - `DELETE /:id` deletes the entity with that ID
- There should be an exported type for each payload shape, and a zod validation schema named `z` + the name of that schema (e.g., `CreateWorkPayload` should have `zCreateWorkPayload`).
- All routes with their handlers and validation schemas need to included in the default export as a `RouteConfig` object.
- Handlers should be exported from the file for testing.
