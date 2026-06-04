# Iroselectronics Website

Next.js storefront backed by PostgreSQL and synced from Odoo inventory.

## PostgreSQL Configuration

The app uses PostgreSQL through `pg`; it does not require Supabase. Configure one of these in your environment:

```bash
LOCAL_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

or:

```bash
LOCAL_DB_HOST=HOST
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=DATABASE
LOCAL_DB_USER=USER
LOCAL_DB_PASSWORD=PASSWORD
```

If your hosted PostgreSQL requires SSL, set:

```bash
LOCAL_DB_SSL=true
```

For serverless hosting such as Vercel, keep the pool small:

```bash
PG_POOL_MAX=5
```

## Vercel Deployment

1. Create a PostgreSQL database on your server and make it reachable from Vercel.
2. Allow inbound database access from Vercel. If your firewall cannot allowlist Vercel IPs reliably, use a connection proxy/pooler or put the database behind a secure endpoint/VPN strategy.
3. Apply the schema to the server database:

```bash
psql "$LOCAL_DATABASE_URL" -f postgres/local-schema.sql
```

4. In Vercel, set the environment variables from `.env.example`, especially:

```bash
LOCAL_DATABASE_URL
LOCAL_DB_SSL
LOCAL_AUTH_SECRET
ADMIN_API_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_SITE_DOMAIN
NEXT_PUBLIC_DEFAULT_LOCALE
```

5. Deploy from GitHub. Vercel will run `npm install` and `npm run build` automatically.

6. Run inventory sync from a trusted machine/server, not as a long-running Vercel task:

```bash
npm run sync:odoo-inventory
```

The sync publishes only Odoo products that have both a price and an image. Missing-image and missing-price reports are written under `reports/odoo-inventory/` locally.

## Local PostgreSQL Setup

1. Start the local PostgreSQL container:

```bash
docker run -d --name iroselectronics_postgres -e POSTGRES_USER=iros -e POSTGRES_PASSWORD=irospass -e POSTGRES_DB=iroselectronics -p 5434:5432 postgres:16-alpine
```

2. Ensure `.env.local` contains:

```bash
LOCAL_DATABASE_URL=postgresql://iros:irospass@127.0.0.1:5434/iroselectronics
LOCAL_AUTH_SECRET=change-this-local-auth-secret
```

3. Build schema and sync catalog data from Odoo:

```bash
npm run setup:local-postgres
```

4. Run the app:

```bash
npm run dev
```

The storefront catalog/home/search endpoints now read from local PostgreSQL.

## Product Specification Enrichment

Use the Playwright enrichment worker to search public product/manual pages and save verified specs into `products.specifications`.

```bash
npm run specs:enrich -- --limit 5
```

Useful options:

```bash
npm run specs:enrich -- --sku BN750 --force
npm run specs:enrich -- --dry-run --limit 1
npm run specs:watch -- --limit 2 --interval 600
```

The watch mode keeps running and automatically enriches products that do not yet have `spec_enrichment.status = "found"`. Enriched specs are stored under `specifications.public_specs` and `specifications.spec_enrichment`, and catalog syncs preserve those fields.
