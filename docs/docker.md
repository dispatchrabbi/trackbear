# Docker

For now, this docs page is just documenting a bunch of commands I'm running for Docker reasons. They're in package.json too (to a certain extent) but it's nice to have them documented here for easy access.

## Build

Build for development:
```sh
docker build -t dispatchrabbi/trackbear:dev --target dev .
```

Build for production:
```sh
docker build -t dispatchrabbi/trackbear:$(npm pkg get version --workspaces=false | tr -d \") -t latest --target prod .
```

## Run

Watching in development:
```sh
docker compose watch
```

Running in development (HMR won't work):
```sh
docker compose up -d
```

Running for development (without docker compose):
```sh
docker run --env-file ./.env -p 3000:3000 -p 24678:24678 --mount type=bind,source="$(pwd)"/../trackbear/certs,target=/certs,readonly --mount type=bind,source="$(pwd)"/../trackbear/db,target=/db --mount type=bind,source="$(pwd)"/logs,target=/logs --name trackbear-dev --rm dispatchrabbi/trackbear:dev
```

Running for production:
```sh
docker run \
  --restart=on-failure:3 \
  -u 1001 \
  --env-file ./trackbear.env \
  -p 127.0.0.1:3000:3000 \
  --mount type=bind,source=/dev/null,target=/certs,readonly \
  --mount type=bind,source="$(pwd)"/db,target=/db \
  --mount type=bind,source="$(pwd)"/logs,target=/logs \
  --name trackbear \
  -d \
  ghcr.io/dispatchrabbi/trackbear:latest
```
