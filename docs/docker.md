# Docker

For now, this docs page is just documenting a bunch of commands I'm running for Docker reasons. They're in package.json too (to a certain extent) but it's nice to have them documented here for easy access.

## Build

In order to build the container:
```sh
npm run build
```

A container is automatically built by Github Actions on the pushing of a new version tag.

## Run

Running the container on production:
```sh
docker run \
  --restart=on-failure:3 \
  --env-file ./trackbear.env \
  -p 127.0.0.1:3000:3000 \
  --mount type=bind,source=/dev/null,target=/certs,readonly \
  --mount type=bind,source="$(pwd)"/db,target=/db \
  --mount type=bind,source="$(pwd)"/logs,target=/logs \
  --add-host host.docker.internal:host-gateway \
  --name trackbear \
  -d \
  ghcr.io/dispatchrabbi/trackbear:latest
```

In practice, a version number is always substituted for `latest` on production.
