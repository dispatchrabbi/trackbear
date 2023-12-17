# BearTracks

**BearTracks** is a writing tracker service. If you're writing, editing, or otherwise engaged in some sort of authorial project, you can track that project on BearTracks.

> BearTracks is... not even in beta. It's in super-mega-alpha mode right now. Honestly, it doesn't even work yet.

## Installation

```sh
# install dependencies
npm install
```

## Setup

```sh
# copy the .env file
cp .env.example .env
```

Here are the environment variables you'll have to supply:

| Variable | Description | Notes |
| --- | --- | --- |
| `NODE_ENV` | Whether the app is in `development` or `production`. | Default is `development`. Semi-standard env var used by express, Vite, and other packages to change behavior. |
| `PORT` | HTTP port for the webapp | Default is `3000`, for development purposes. |
| `COOKIE_SECRET` | This is the secret used to sign the session ID cookie | Use a random string of characters for this. Changing this will invalidate existing sessions. See https://www.npmjs.com/package/express-session#secret for more details. |
| `DATABASE_URL` | Database connection string | Default is `"file:../db/db.sqlite"`. Used for Prisma; see https://pris.ly/d/connection-strings for more details. |

## Developing

```sh
npm run start
```

This will start up both the back end and the front end. It'll also give you hot module reloading and all the other wonderful stuff Vite gives you. You probaby don't need anything else.

## Deploying

???

## Acknowledgements

Polar bear photo by <a href="https://unsplash.com/@hansjurgen007?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Hans-Jurgen Mager</a> on <a href="https://unsplash.com/photos/polar-bear-on-snow-covered-ground-during-daytime-qQWV91TTBrE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>.
