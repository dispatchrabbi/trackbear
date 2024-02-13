# Based on https://raw.githubusercontent.com/BretFisher/node-docker-good-defaults/main/Dockerfile
# and https://raw.githubusercontent.com/BretFisher/nodejs-rocks-in-docker/main/dockerfiles/3.Dockerfile

###############################################################################
# base stage
FROM node:lts-slim as base

# Install the latest openssl (for HTTPS), curl, and psql (for debugging)
RUN apt update -y && apt install -y openssl curl postgresql-client

# Default NODE_ENV to development (the safest); later stages will override this if needed
ENV NODE_ENV=development

# Default to port 3000 for Node
ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT

# Use the built-in node user so that we're not running as root
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node

# WORKDIR now sets correct permissions if you set USER first
# We'll use /app for all our stuff
WORKDIR /app

# Pull in package.json in prep for dependency installation
COPY --chown=node:node package.json package-lock.json* ./

# Install only the production dependencies (we'll install dev deps in the dev stage)
# RUN npm ci --prefer-offline --no-audit --no-fund && npm cache clean --force
RUN --mount=type=cache,target=~/.npm npm ci --no-audit --no-fund

# Make sure we can run commands from node_modules/.bin
ENV PATH /app/node_modules/.bin:$PATH

###############################################################################
# dev stage
FROM base as dev

# overwrite NODE_ENV to development
ENV NODE_ENV=development

# Expose port 24678 for HMR
EXPOSE 24678

# Expose ports 9229 and 9230 (tests) for debug
EXPOSE 9229 9230

# Install all the dev deps (you can't do just that, so we have to install everything)
RUN --mount=type=cache,target=~/.npm npm install

# Copy the code in
COPY --chown=node:node . .

# Regenerate db models (needs an existing but fake DB_APP_DB_URL in the env)
ENV DB_APP_DB_URL $DB_APP_DB_URL
RUN npx prisma generate

# Check every 30s to ensure /api/ping returns HTTP 200
HEALTHCHECK --interval=30s CMD node ./scripts/healthchecks/trackbear.js

# Start the server (this also runs migrations)
CMD [ "./entrypoint.sh" ]

###############################################################################
# prod stage
FROM base as prod

# overwrite NODE_ENV to production
ENV NODE_ENV=production

# Copy the code in
COPY --chown=node:node . .

# Regenerate db models (needs an existing but fake DB_APP_DB_URL in the env)
ENV DB_APP_DB_URL $DB_APP_DB_URL
RUN npx prisma generate

# Build the front-end
RUN npm run build:client

# Check every 30s to ensure /api/ping returns HTTP 200
HEALTHCHECK --interval=30s CMD node ./scripts/healthchecks/trackbear.js

# Start the server (this also runs migrations)
CMD [ "./entrypoint.sh" ]
