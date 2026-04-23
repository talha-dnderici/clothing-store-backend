# Clothing Store Backend

This project is a NestJS microservice backend for a clothing store website. It uses MongoDB, keeps DTO and interface files explicit for readability, and exposes all CRUD and single-item endpoints through one HTTP API gateway. It also includes a Vite playground frontend to test checkout, invoice email, comments, ratings, manager approval, order status, and pricing flows from the browser.

## Architecture

- `api-gateway`: Public HTTP entry point.
- `register-service`: User registration and user CRUD.
- `login-service`: Authentication and login session CRUD.
- `main-service`: Product CRUD.
- `card-service`: Shopping card CRUD.
- `mongodb`: Shared database used by all services through `MONGODB_URI`.
- `mailpit`: Local SMTP inbox for invoice emails in Docker.

Microservices communicate with each other over NestJS TCP transport. The `login-service` asks the `register-service` for user credentials instead of duplicating user documents, which helps avoid unnecessary data waste.

## Project Structure

```text
apps/
  api-gateway/
  login-service/
  register-service/
  main-service/
  card-service/
frontend/
libs/common/
docker-compose.yml
Dockerfile
```

## Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update values in `.env` if you want to override the Docker defaults.

### MongoDB Atlas Setup

If you need to create the database yourself, MongoDB Atlas is a good fit for this project because every Nest service already reads the same `MONGODB_URI` value.

1. Create a free cluster in MongoDB Atlas.
2. Create a database user with read/write access.
3. In `Network Access`, allow your current IP address. For development, you can temporarily allow `0.0.0.0/0` and tighten it later.
4. Copy the SRV connection string from Atlas.
5. Create a local environment file:

```bash
cp .env.example .env
```

6. Replace `MONGODB_URI` inside `.env` with your own Atlas connection string.

Example:

```env
MONGODB_URI=mongodb+srv://myUser:myPassword@my-cluster.mongodb.net/clothing_store?retryWrites=true&w=majority&appName=clothing-store
```

Important:

- Do not commit real Atlas usernames or passwords.
- If your password contains special characters such as `@`, `:` or `/`, URL-encode it before putting it into the connection string.
- All services in this repository connect to the same database, so one valid `MONGODB_URI` is enough.

## Run With Docker

Use one command to build and start the whole project, including MongoDB, seed data, Mailpit, backend services, and the playground frontend:

```bash
docker compose up --build
```

The API gateway will be available at:

- `http://localhost:3000`

The playground frontend will be available at:

- `http://localhost:3001/playground`

The local email inbox will be available at:

- `http://localhost:8025`

Seeded test users:

```text
customer@aura.test / password123
manager@aura.test / password123
```

To stop containers:

```bash
docker compose down
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start each service in a separate terminal:

```bash
npm run start:dev:register
```

```bash
npm run start:dev:login
```

```bash
npm run start:dev:main
```

```bash
npm run start:dev:card
```

```bash
npm run start:dev:gateway
```

```bash
npm run start:dev:frontend
```

3. In a separate terminal, install frontend dependencies once:

```bash
cd frontend
npm install
```

4. Create a local frontend environment file:

```bash
cp frontend/.env.local.example frontend/.env.local
```

5. Make sure `.env` contains a valid `MONGODB_URI` value for MongoDB Atlas.

The frontend development server runs on:

- `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /auth/register`
- `POST /auth/login`

### Users

- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Sessions

- `GET /sessions`
- `GET /sessions/:id`
- `PATCH /sessions/:id`
- `DELETE /sessions/:id`

### Products

- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `PATCH /manager/products/:id/pricing`

### Comments and Ratings

- `POST /products/:id/comments`
- `POST /products/:id/ratings`
- `GET /products/:id/comments`
- `GET /products/:id/ratings`
- `GET /manager/comments?status=pending`
- `PATCH /manager/comments/:id`

Ratings are published immediately. Comments can be submitted without a rating, and every comment with text remains pending until a manager approves it.

### Orders and Invoices

- `POST /orders/checkout`
- `GET /orders`
- `GET /manager/orders`
- `PATCH /manager/orders/:id/status`
- `GET /orders/:id/invoice`
- `GET /orders/:id/invoice/pdf`
- `POST /orders/:id/invoice/email`

Checkout generates a PDF invoice and sends it through SMTP. In Docker, the PDF email is delivered to Mailpit.

### Cards

- `POST /cards`
- `GET /cards`
- `GET /cards/:id`
- `PATCH /cards/:id`
- `DELETE /cards/:id`

## Playground

Open `http://localhost:3001/playground` after `docker compose up --build`. The page includes customer login, manager login, rating submission, comment approval, checkout, invoice PDF/email controls, order status management, and product price/discount controls.

## Example Payloads

### Register

```json
{
  "name": "Talha",
  "email": "talha@example.com",
  "password": "123456",
  "taxId": "TR1234567890",
  "address": "Istanbul"
}
```

### Login

```json
{
  "email": "talha@example.com",
  "password": "123456"
}
```

### Product

```json
{
  "name": "Oversize Hoodie",
  "description": "Premium cotton hoodie",
  "category": "hoodie",
  "price": 49.99,
  "stock": 100,
  "imageUrl": "https://example.com/hoodie.png"
}
```

### Card

```json
{
  "userId": "67f00123456789abcdef012",
  "items": [
    {
      "productId": "67f00123456789abcdef099",
      "quantity": 2,
      "selectedSize": "L",
      "selectedColor": "Black"
    }
  ],
  "status": "active"
}
```

## Notes

- Comments inside the source files are written in English as requested.
- Old Express files were left in the repository, but the new startup path is the NestJS microservice structure under `apps/`.
- MongoDB runs remotely through the connection string stored in `.env`; Docker Compose no longer starts a local database container.
- If `npm install` has not been run yet, local execution and Docker builds will fail until dependencies are installed.

## Deploy Backend To Hugging Face Spaces

This repository includes a single-container backend image for Hugging Face Spaces at `Dockerfile.hf`.

It starts all Nest microservices inside one container and exposes only the API gateway on port `7860`, which matches the default public port used by Docker Spaces.

### 1. Push this repository to GitHub

```bash
git add -A
git commit -m "Add Hugging Face backend deployment"
git push origin main
```

### 2. Create a new Docker Space

On Hugging Face:

1. Create a new Space.
2. Choose `Docker` as the SDK.
3. Connect the GitHub repository or upload the repository contents.

### 3. Add a Space README front matter

In the Hugging Face Space repository, make sure the `README.md` starts with:

```md
---
title: Clothing Store Backend
sdk: docker
app_port: 7860
---
```

The rest of the README content can stay below that block.

### 4. Tell the Space to use the backend Dockerfile

Hugging Face Docker Spaces look for `Dockerfile` by default. The easiest setup is:

```bash
cp Dockerfile.hf Dockerfile
```

If you want to keep both Dockerfiles, do that copy in the Hugging Face Space repository before the build starts.

### 5. Add Space secrets

Add these values in the Space settings:

- `MONGODB_URI`
- `JWT_SECRET`

Optional overrides if you want them:

- `PORT=7860`
- `GATEWAY_PORT=7860`

### 6. Use the public Space URL in the frontend

After the Space builds, it will expose a public URL like:

- `https://your-space-name.hf.space`

Then set the frontend environment value on Render to:

```bash
API_BASE_URL=https://your-space-name.hf.space
```

If the frontend is also using a public variable, set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-space-name.hf.space
```

### Notes

- `Dockerfile.hf` is only for the backend on Hugging Face Spaces.
- The separate `frontend/` app should stay on Render as a normal web service.
- Do not commit real production secrets into `.env`, `.env.example`, or the Hugging Face repository.

## Deploy Frontend To Render

The frontend is ready to run on Render from the `frontend/` directory.

This repository also includes a `render.yaml` blueprint that points the frontend to the Hugging Face backend at:

- `https://talha-dnderici-clothes.hf.space`

### Render settings

- Service type: `Web Service`
- Runtime: `Node`
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

### Render environment variables

- `API_BASE_URL=https://talha-dnderici-clothes.hf.space`
- `NEXT_PUBLIC_API_BASE_URL=https://talha-dnderici-clothes.hf.space`
