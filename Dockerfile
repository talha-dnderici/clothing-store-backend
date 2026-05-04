FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

ARG APP_NAME
ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY scripts ./scripts
COPY .env.example ./.env

CMD ["sh", "-c", "npm run start:prod:$APP_NAME"]
