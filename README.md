
# URL Shortener

This is a full-stack, production-ready URL shortener built with Next.js, TypeScript, Prisma, PostgreSQL, Redis, and NextAuth.js. It supports user authentication, custom slugs, visit tracking, rate limiting, and Dockerized deployment.

## Features

- Shorten URLs with custom or auto-generated slugs
- User registration and authentication (NextAuth.js, JWT)
- User dashboard with visit analytics and slug editing
- Rate limiting on all sensitive endpoints
- Redis caching for fast redirects and global counters
- Prisma ORM with PostgreSQL
- Docker and docker-compose support for easy local development

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & docker-compose

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://dev:devpass@localhost:5432/urlshortener
REDIS_URL=redis://localhost:6379
SQIDS_SALT=your-sqids-salt
NEXTAUTH_SECRET=your-nextauth-secret
```

### Local Development

Start PostgreSQL and Redis using docker-compose:

```sh
docker-compose up -d
```

Install dependencies and run migrations:

```sh
npm install
npx prisma migrate dev
```

Start the app:

```sh
npm run dev
```

### Running with Docker

Build and run the Docker image:

```sh
docker build -t url-shortener .
docker run --env-file .env -p 3000:3000 url-shortener
```

### Usage

- Register and sign in to create and manage your short URLs
- Use the dashboard to view analytics and edit slugs
- Copy short URLs to the clipboard for easy sharing

## Project Structure

- `pages/` - Next.js pages and API routes
- `lib/` - Shared libraries (Prisma client, rate limiting, etc.)
- `prisma/` - Prisma schema
- `Dockerfile` & `docker-compose.yml` - Containerization

## Notes for Reviewers

- All environment variables are required for production and local use
- Rate limiting is enforced on registration, sign-in, shorten, and redirect endpoints
- The `.next` folder is excluded from git via `.gitignore`

---

Feel free to reach out with any questions or feedback!