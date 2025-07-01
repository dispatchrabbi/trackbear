import "@typespec/http";
import "@typespec/openapi";

import "./response-models.tsp";
import "./shared-models.tsp";

import "./v1/index.tsp";

using Http;
using OpenAPI;

@service(#{ title: "TrackBear" })
@server("https://trackbear.app/api/v1", "TrackBear API")
@info(#{ version: "1.0.0" })
@doc("""
  # Using the TrackBear API
  
  The TrackBear API is a pretty straightforward REST(ish) API that uses JSON. Read on to learn the specifics of how to
  authenticate to and use the TrackBear API.
  
  And if you make something cool, [drop me a line and let me know!](https://trackbear.app/contact)
  
  ## Common response format
  
  Every response from the TrackBear API is wrapped in a data structure that tells you whether it succeeded or failed
  and, if it failed, why. While you can get much of this information from the status code, the failure response also
  includes a specific error code and a human-readable error message.
  
  Successful calls will have a response with this shape:
  
  ```json
  // 200 OK
  {
    "success": true,
    "data": { ... } // the response payload goes here
  }
  ```
  
  For simplicity, this wrapper is omitted from the API documentation.
  
  If your call fails, the response will have this shape (for example):
  ```json
  // 409 Conflict
  {
    "success": false,
    "code": "ALREADY_JOINED",
    "message": "You are already part of this leaderboard."
  }
  ```
  
  Common HTTP error statuses, codes, and messages for this API include:
  
  | Status | Code | Example Message |
  |---|---|---|
  | 403 | FORBIDDEN | Forbidden |
  | 404 | NOT_FOUND | Could not find a project with id 123 |
  | 429 | TOO_MANY_REQUESTS | Rate limit exceeeded |
  
  Endpoint-specifc HTTP error statuses and codes are documented with those endpoints.
  
  ## Authentication
  
  In order to use the API, you will need to obtain an API key from the API page in Settings in the TrackBear webapp.
  Once you have the API key, send it along with every request in the `X-Api-Key` header:
  
  ```
  X-Api-Key: YOUR_API_KEY_HERE
  ```
  
  ## Identifying your app
  
  > This is inspired by [the API guidelines for Advent of Code](https://www.reddit.com/r/adventofcode/wiki/faqs/automation/#wiki_put_your_contact_info_in_your_script.27s_user-agent_header).
  
  All requests should include a `User-Agent` header that contains some form of contact info for the developer of the
  app or script making the request. This is so that, if something goes wrong or there is a major upcoming change, I can
  reach out and warn you before either your code breaks or you get blocked. This is the only way I will use your contact
  info.
  
  Bonus points if your `User-Agent` includes a URL where I can check out your work!
  
  A few examples of good `User-Agent` strings:
  
  ```
  User-Agent: TrackBear (trackbearapp@gmail.com)
  User-Agent: github.com/dispatchrabbi/trackbear by trackbearapp@gmail.com
  User-Agent: TrackBear/1.0 (trackbear.app) by trackbearapp@gmail.com
  ```
  
  ## Rate limits
  
  Requests are limited to 100 requests per minute. You can see how you're doing against your rate limits by checking the
  `RateLimit` and `RateLimit-Policy` response headers:
  
  ```
  // the limit is 100 requests, you have 95 remaining, and that will reset in 25 seconds
  RateLimit: limit=100,remaining=95,reset=25
  // the policy is 100 requests per each 60 second window
  RateLimit-Policy: 100,w=60
  ```
  
  If you exceed the rate limit, you will receive a 429 status code in your response, and the headers will tell you when
  you can try again.
  """)
@useAuth(TrackBearAuth)
namespace TrackBear;
