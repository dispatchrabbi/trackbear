# 🐻 TrackBear

**TrackBear** is a writing tracker service. If you're writing, editing, or otherwise engaged in some sort of authorial project, you can track that project on TrackBear!

## Prerequisites

You'll need a Postgres database to back TrackBear up. The easiest way to make this work is by using the included docker-compose.yaml file.

```sh
docker compose up
```

**The first time you set up your docker stack, you will need to manually create the `queue` database.** This is a limitation of the Postgres docker container. Exec into the container (`docker exec -it /bin/bash trackbear-db-1`) and run:

```sh
createdb -U $POSTGRES_USER queue
```

## Setup

```sh
# install dependencies
npm install

# copy the .env file and then fill it out
cp .env.example .env
```

See [the environment variable documentation](./docs/env.md) for more details on environment variables.

## Developing

To start TrackBear in development mode:

```sh
node --run start
```

You can also start TrackBear in production mode:

```sh
# compile the app first
node --run compile

# then start it up
node --run start:prod
```

### Testing

You can run tests thus:

```sh
node --run test
```

or you can look at the results in a web-based UI:

```sh
node --run test:webui
```

There is also coverage reporting available, which will deposit a coverage report in _coverage/_:

```sh
node --run coverage
```

### Migrations

Building and running the docker containers should take care of any migrations that Prisma can detect. If you need to make a new migration, you can run `npx prisma migrate --create-only`.

### Tagging a new version

To tag a new version, run:

```sh
npm version [major | minor | patch]
```

This will:

- Build the app and container (to make sure it's green)
- Change the version in `package.json` and `package-lock.json` to the new version
- Add and commit any changed files with the commit message `v${VERSION}`
- Create a tag called `v${VERSION}`

It's up to you to push the commit and tags:

```sh
git push
git push --tags
```

Once you do this, a Github Action will build a production-ready container and upload it to ghcr.io.

## Deploying

The app runs as a container on the server. There's no fancy remote deploy yet, so to update, you'll need to SSH into the server, and run the container restart script.

This should probably be made better at some point, but for now, it works fine.

## Acknowledgements

Polar bear photo by <a href="https://unsplash.com/@hansjurgen007?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Hans-Jurgen Mager</a> on <a href="https://unsplash.com/photos/polar-bear-on-snow-covered-ground-during-daytime-qQWV91TTBrE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>.

Thank you to the Overachievers Discord Chat for alpha-testing this and providing many good suggestions. Thank you to many, many other people for suggesting new features and finding bugs. See ACKNOWLEDGEMENTS.md and CHANGELOG.md for a list!
