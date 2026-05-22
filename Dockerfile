FROM node:20-alpine AS builder

WORKDIR /usr/src/app

ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_FACTOR=2
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

ARG APP_NAME
ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/dist ./dist
COPY scripts ./scripts
COPY .env.example ./.env

CMD ["sh", "-c", "npm run start:prod:$APP_NAME"]
