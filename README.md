# Product Customization Platform

A Tiny Barns-style product customization platform. Users pick a product category, customize it with text, colors, and icons on a draggable canvas, then download as PNG or save for later (shareable link).

## Purpose

Let customers design products (baskets, backpacks, sweaters, etc.) before purchase. Configure categories and options in the admin panel; customers use the builder to personalize and export or save their designs.

## Features

- **Customer-facing builder**: Category tabs, Konva canvas with draggable text/icons, options panel
- **Download**: Export customized design as high-res PNG
- **Saved designs**: Anonymous save with shareable link (`/design/[slug]`)
- **Admin panel**: Categories, site settings (Buy link URL, expiry)
- **Auth**: Credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database (SQLite by default):
   ```bash
   # .env should have DATABASE_URL="file:./dev.db"
   npx prisma migrate dev
   npm run db:seed
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Using the builder (customers)

Select a category tab, choose options (size, color, text, icons), drag elements on the canvas, then **Download** or **Save** your design.

### Admin

- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
- Login: Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` (see `.env.example`)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Full URL, e.g. `http://localhost:3000` |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |

## Admin Portal

- **Categories** — Add product categories (e.g. Baskets, Backpacks). Edit each to configure attributes (Size, Product Color, Text, Icons, etc.) and upload images per variation.
- **Settings** — Buy link URL/label, company logo, saved design expiry, section order.
- **Help** — In-app help at `/admin/help` with details on each option type and how to use them.

## Deployment (CapRover)

1. Create an app in CapRover and enable **Persistent Directory** `/app/data` for SQLite.
2. Set env vars: `DATABASE_URL` (`file:./data/dev.db`), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Add GitHub secrets for auto-deploy: `CAPROVER_SERVER`, `CAPROVER_APP_ECOMMERCE`, `CAPROVER_APP_TOKEN_ECOMMERCE`.
4. Push to `master` — the workflow deploys automatically.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Customer builder
│   ├── admin/                # Admin panel
│   ├── design/[slug]/        # Saved design viewer
│   └── api/                  # API routes
├── components/builder/       # Canvas, tabs, options panel
└── lib/                     # DB, env helpers
```

## Database

- **SQLite** (default): Works out of the box, file-based
- **PostgreSQL**: Change `provider` in `prisma/schema.prisma` and set `DATABASE_URL`

Use Prisma Studio to manage data: `npm run db:studio`
