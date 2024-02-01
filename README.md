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

See [the environment variable documentation](./docs/env.md) for more details on environment variables.

## Developing

```sh
npm run start:dev
```

This starts up the app in a docker container in development mode. It'll do hot module reloading and all the other creature comforts, and it'll start up any dependent services as well (there aren't any currently, but soon there will be a database service, because Prisma and SQLite don't play super nicely when it comes to multiple connections).

You can also start up the app in a docker container in production mode:

```sh
npm run start:prod
```

You *can* start up the app locally (outside of a container) using `npm run local:start:dev` and `npm run local:start:prod` but **these are deprecated and you shouldn't use them**.

### Migrations

Building and running the docker containers should take care of any migrations that Prisma can detect. If you need to make a new migration, you can run `npx prisma migrate --create-only`.

### Tagging a new version

To tag a new version, run:

```sh
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]
```

This will:

- Build the app (to make sure it's green)
- Change the version in `package.json` and `package-lock.json` to the new version
- Add and commit any changed files with the commit message `v${VERSION}`
- Create a tag called `v${VERSION}`

It's up to you to push the commit and tags:

```sh
git push
git push --tags
```

## Deploying

No fancy deploying yet, just SSHing onto the server. Pull the version you want (latest or tag) and:

```sh
./scripts/deploy-docker.sh
```

The update script will back up the database, rebuild the container, and restart it in place.

## Acknowledgements

Polar bear photo by <a href="https://unsplash.com/@hansjurgen007?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Hans-Jurgen Mager</a> on <a href="https://unsplash.com/photos/polar-bear-on-snow-covered-ground-during-daytime-qQWV91TTBrE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>.

Thank you to the Overachievers Discord Chat for alpha-testing this and providing many good suggestions. See ACKNOWLEDGEMENTS.md and CHANGELOG.md for a list!
