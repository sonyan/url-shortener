# url-shortener

## Environment Variables

This app requires the following environment variables (see `.env`):

```
DATABASE_URL=postgresql://dev:devpass@localhost:5432/urlshortener
REDIS_URL=redis://localhost:6379
SQIDS_SALT=your-sqids-salt
NEXTAUTH_SECRET=your-nextauth-secret
```

## Running with Docker

To build and run the Docker image with your environment variables:

1. Build the image:
   ```sh
   docker build -t url-shortener .
   ```
2. Run the container, passing your `.env` file:
   ```sh
   docker run --env-file .env -p 3000:3000 url-shortener
   ```

This ensures all required environment variables are available inside the container.