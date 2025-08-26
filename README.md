# Strict POSIX cron: Builder & Parser

A minimal strict POSIX cron builder and parser.

## Getting started

- Install dependencies:
    - `pnpm install`
- Start dev server:
    - `pnpm dev`
    - The app runs on http://localhost:5173 by default.

## Production build and run (without Docker)

- Build: `pnpm build`
- Start: `pnpm start`
    - This launches the SvelteKit Node server (default PORT=3000, HOST=0.0.0.0)

## Docker

- Build the image:
    - `docker build -t cron-builder-parser:latest .`
- Run the container:
  -
  `docker run -d --name cron-builder-parser -p 8080:3000 --env PORT=3000 --env HOST=0.0.0.0 cron-builder-parser:latest`
    - Visit http://localhost:8080
- Healthcheck:
    - The image includes a Docker HEALTHCHECK hitting `http://127.0.0.1:3000/`. Inspect via
      `docker ps`.

## Configuration

- Environment variables:
    - `PORT` (default 3000)
    - `HOST` (default 0.0.0.0)
