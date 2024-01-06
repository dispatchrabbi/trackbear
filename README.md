# 🐻 TrackBear

**TrackBear** is a writing tracker service. If you're writing, editing, or otherwise engaged in some sort of authorial project, you can track that project on TrackBear!

> TrackBear is... not even in beta. It's in super-mega-alpha mode right now. Please don't use it unless you are willing to be testing an alpha build.

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

| Variable | Description | Default | Notes |
| --- | --- | --- | --- |
| `PORT` | HTTP port for the webapp | `3000` | |
| `LOG_DIR` | Directory for the logs | `./logs` | |
| `COOKIE_SECRET` | This is the secret used to sign the session ID cookie | (not set) | Use a random string of characters for this. Changing this will invalidate existing sessions. See https://www.npmjs.com/package/express-session#secret for more details. |
| `DATABASE_URL` | Database connection string | `"file:../db/trackbear.db"` | Path is relative to the prisma.schema file, located in prisma/. See https://pris.ly/d/connection-strings for more details. |
| `USE_PROXY` | Whether Trackbear is behind a proxy | `0` | Use this if Trackbear is behind a proxy like nginx. |
| `USE_HTTPS` | Whether to serve HTTPS or HTTP | `0` | If set to `1`, `TLS_KEY` and `TLS_CERT` must also be set. |
| `TLS_KEY` | The private key for TLS serving HTTPS | (not set) | If using Let's Encrypt, this is the `privkey.pem` file. |
| `TLS_CERT` | The public certificate for TLS serving HTTPS | (not set) | If using Let's Encrypt, this is the `fullchain.pem` file. |


## Developing

```sh
npm run start:dev
```

This will start up both the back end and the front end. It'll also give you hot module reloading and all the other wonderful stuff Vite gives you. You probaby don't need anything else.

To preview production, you can:

```sh
npm run build
npm run start:prod
```

### Migrations

If you make a change to `schema.prisma`, you'll need to:

```sh
npm migrate:dev
```

**Only do this on development.** This command will take care of detecting the drift, ask you what your migration should be called, perform the migration on your local database, and regenerate the Prisma models.

The command is idempotent so it's okay to run it just to make sure your database is up-to-date.

## Deploying

No fancy deploying yet, just SSHing onto the server. Pull the version you want (latest or tag) and:

```sh
./scripts/update-on-production.sh
```

The update script will build the front end, apply migrations, and restart the app in pm2 (see below).

The server uses pm2 to stay up and running. The app config is in `ecosystem.config.cjs`.

## Acknowledgements

Polar bear photo by <a href="https://unsplash.com/@hansjurgen007?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Hans-Jurgen Mager</a> on <a href="https://unsplash.com/photos/polar-bear-on-snow-covered-ground-during-daytime-qQWV91TTBrE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>.

Thank you to the Overachievers Discord Chat for alpha-testing this and providing many good suggestions. See ACKNOWLEDGEMENTS.md for a list!
