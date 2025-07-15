# Rate limits

Requests are limited to 100 requests per minute per API token. You can see how you're doing against your rate limits by checking the `RateLimit-Policy` and `RateLimit` response headers:

```
// the policy is 100 requests (`q`) per each 60 second window (`w`)
RateLimit-Policy: "100-in-1min"; q=100; w=60; pk=:MGMzNGM3YmU2MTlj:
// you have 95 requests left (`r`) before the window resets in 25 seconds (`t`)
RateLimit: "100-in-1min"; r=95; t=25
```

If you exceed the rate limit, you will receive a 429 status code with your response, and the headers will tell you when you can try again.