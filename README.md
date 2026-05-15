# YT Xspin

Plataforma web para descubrimiento y exposicion de contenido de pequenos creadores de YouTube.

## Estructura

- `frontend`: app Next.js para feed vertical, registro y dashboard.
- `backend`: API NestJS para usuarios, canales, videos, senales de exposicion y sincronizacion con YouTube.

## Desarrollo local

```bash
npm install
docker compose up -d postgres
npm --workspace backend run prisma:generate
npx prisma migrate dev --name init_exchange_algorithm --schema backend/prisma/schema.prisma
npm run dev:frontend
npm run dev:backend
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000/api`

PostgreSQL local:

```text
Host: localhost
Port: 5433
Database: yt_xspin
User: yt_xspin
Password: yt_xspin_dev_password
```

Comandos utiles:

```bash
docker compose ps
docker compose logs postgres
npx prisma studio --schema backend/prisma/schema.prisma
```
