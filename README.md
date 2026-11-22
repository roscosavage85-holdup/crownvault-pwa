# CrownVault

CrownVault is a full-stack Progressive Web App built with React, Express, PostgreSQL, Redis, and Docker.

## Development

```bash
cd client
npm install
npm start
```

```bash
cd server
npm install
npm start
```

Set `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` in a local `.env` file.

## Production

```bash
cp .env.example .env
npm --prefix client run build
npm --prefix server start
```

PostgreSQL schema: `db/schema.sql`.
