# Dockerfile for Next.js + Prisma + PostgreSQL
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --frozen-lockfile || yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production image
FROM node:20-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app .

EXPOSE 3000

CMD ["npm", "start"]
