# Environment Variables

This is a list of the environment variables that Trackbear requires. Any environment variable that has a default value of "(not set)" must be set in the *.env* file before Trackbear will run. All the others will default to the given value if not set once the app is running, in _server/lib/env.ts_.

> **Do not quote any string values in your .env file if you are using regular `docker run`!** The quotes will not be stripped away and will be considered part of the string.

## Container options

These are only needed for working with the Docker Compose files.

| Variable | Default | Notes |
| --- | --- | --- |
| `DB_VOLUME_DIR` | (not set) | This directory will be used for the PostgreSQL database files and to write database backups to. |

## Server options

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3000` | Which port to serve Trackbear on. |
| `HAS_PROXY` | `0` | Set to `1` to signal to Express that Trackbear is being served behind a proxy (like nginx). |

## HTTPS/TLS

| Variable | Default | Notes |
| --- | --- | --- |
| `ENABLE_TLS` | `0` | Set to `1` to serve Trackbear with HTTPS/TLS. If set to `1`, `TLS_KEY_PATH` and `TLS_CERT_PATH` must also be set. |
| `TLS_KEY_PATH` | (not set) | The private key for TLS serving HTTPS. If using Let's Encrypt, this is the `privkey.pem` file. |
| `TLS_CERT_PATH` | (not set) | The public certificate for TLS serving HTTPS. If using Let's Encrypt, this is the `fullchain.pem` file. |
| `TLS_ALLOW_SELF_SIGNED` | `0` | Set to `1` if your cert is self-signed. This will allow healthchecks to correctly access the server. |

## Logs

| Variable | Default | Notes |
| --- | --- | --- |
| `LOG_LEVEL` | `info` | The minimum log level to log. Options are `debug`, `info`, `warn`, `error`, `critical`. |
| `LOG_PATH` | `/logs` | The directory to create logs in. Don't set this unless you're running outside a container for some reason. |

## Database

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_USER` |  | The username to use with the Postgres database |
| `DATABASE_PASSWORD` |  | The password to use with the Postgres database |
| `DATABASE_NAME` |  | The database name to use |
| `DATABASE_HOST` |  | The hostname for the Postgres database |
| `DATABASE_URL` | `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}?schema=${DATABASE_SCHEMA}` | This URL is used by the Prisma schema (see *prisma/schema.prisma*) to connect to the database. |

## Rate limiting

| Variable | Default | Notes |
| --- | --- | --- |
`DISABLE_RATE_LIMITS` | 0 | Set to `1` to disable rate limits on the API. |

## Session/Cookies

| Variable | Default | Notes |
| --- | --- | --- |
`COOKIE_SECRET` | (not set) | This is the secret used to sign the session ID cookie. Use a random string of characters for this, at least 24 characters long. Changing this will invalidate existing sessions. See https://www.npmjs.com/package/express-session#secret for more details. |

## Email

| Variable | Default | Notes |
| --- | --- | --- |
| `ENABLE_EMAIL` | `1` | Set to `0` to disable sending email. If disabled, a warning will be logged whenever an email would have been sent. This is mostly intended for development purposes. |
| `MAILERSEND_API_KEY` | (not set) |  A MailerSend API key, to be used when the app sends email. |
| `EMAIL_URL_PREFIX` | (not set) | The URL prefix to use when constructing links in emails, since Trackbear doesn't know what the URLs should look like from the user perspective. Will be prefixed on paths relative to the root of the app. Example: `https://locahost:3000`. |

## Uploads

| Variable | Default | Notes |
| --- | --- | --- |
| `UPLOADS_PATH` | `/uploads` | The directory where uploaded files go. Don't set this unless you're running outside a container for some reason. |

## Metrics

| Variable | Default | Notes |
| --- | --- | --- |
| `ENABLE_METRICS` | `0` | Set to `0` to disable collecting metrics. |
| `PLAUSIBLE_HOST` | (not set) |  The host to send metrics to. Example: `https://metrics.trackbear.app`. |
| `PLAUSIBLE_DOMAIN` | (not set) |  The domain in Plausible to associate metrics with. Example: `trackbear.app`. |