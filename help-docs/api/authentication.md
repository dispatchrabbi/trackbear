# Authentication

In order to use TrackBear's API, you will, of course, need a TrackBearer token. You can create one from the [API Keys settings page](https://trackbear.app/account/api-keys). To get there, open the user menu in the top right corner and then choose **API Keys**.

Once you have the API token, send it along with every request in the `Authorization` header as a `Bearer` token:

```
Authorization: Bearer <YOUR_API_TOKEN_HERE>
```

## Identifying your app

> This is inspired by [the API guidelines for Advent of Code](https://www.reddit.com/r/adventofcode/wiki/faqs/automation/#wiki_put_your_contact_info_in_your_script.27s_user-agent_header).

All requests should include a `User-Agent` header that contains some form of contact info for the author of the app or script making the request. Bonus points if your `User-Agent` includes a URL where I can check out your work!

::: tip Why?

Good question! Here are a few reasons:

- If your app is causing an issue, I'd rather be able to contact you and ask you to fix it than have to block your app.
- If you contact me for help, I can look up your app's activity easily and get you a quicker solution.
- If there's a major upcoming change, I can reach out and warn you that your code might break. (Not that I'm planning any major changes.)
- I saw Advent of Code do it (see above) and thought it was a cool idea.
- TrackBear is a hobby project of mine and I want to see what cool things people are doing with the API!

I will only use your contact info for reasons like those above, and they will never shown to anyone else.

:::

A few examples of good `User-Agent` strings:

```
# The app name and version, plus the repo and the author's email address
User-Agent: Example App/1.0 (github.com/author-username/example-app) by author@example.com

# The app name and version, plus the website and the author's email address
User-Agent: Example App/1.0 (app.example.com) by author@example.com

# Just the app name and the author's email address
User-Agent: Example App (author@example.com)

# The app repo and the author's email address
User-Agent: github.com/author-username/example-app by author@example.com
```