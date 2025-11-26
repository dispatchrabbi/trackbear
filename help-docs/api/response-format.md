# Response format

Every response from the TrackBear API is wrapped in a data structure that tells you whether it succeeded or failed and, if it failed, why. While you can get much of this information from the status code, the failure response also includes a specific error code and a human-readable error message.

For simplicity, this wrapper is omitted from the response shape in each endpoint's documentation.

## Success

Successful calls will have a response with this shape:

```json
{
  "success": true,
  "data": { ... } // the response payload goes here
}
```

For example, a successfull call to `GET /api/v1/ping` will result in:

```json
// 200 OK
{
  "success": true,
  "data": "pong"
}
```

## Failure

If your call fails, the response will have this shape:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "A human-readable error message"
  }
}
```

For example, attempting join a leaderboard you are already part of via `POST /leaderboard/8fb3e519-fc08-477f-a70e-4132eca599d4/me` will result in:

```json
// 409 Conflict
{
  "success": false,
  "error": {
    "code": "ALREADY_JOINED",
    "message": "You are already part of this leaderboard."
  }
}
```

Common HTTP error statuses, codes, and messages for this API include:

| Status | Code | Example Message |
|---|---|---|
| 403 | FORBIDDEN | Forbidden |
| 404 | NOT_FOUND | Could not find a project with id 123 |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeeded |

Endpoint-specifc HTTP error statuses and codes are documented with those endpoints.

::: tip
If you need logic based on failure states, it's best to use the HTTP status code. If you can't use that, use the error code. The human-readable error message is solid enough to be displayable to users, but it is subject to change and may not be consistent.
:::