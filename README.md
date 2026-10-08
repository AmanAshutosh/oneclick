# OneClick CMS

A full-stack, WordPress-style CMS built with a modern TypeScript stack: an **Admin Panel** for writing and managing content, and a **Public Website** that renders it — fast, SEO-friendly and accessible.

## Stack

| Layer      | Choice                                                         |
| ---------- | -------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, React 19, Server Components)           |
| Database   | Prisma ORM + SQLite (dev) / PostgreSQL or MySQL (prod)         |
| Auth       | Email + password (bcrypt), JWT session in an httpOnly cookie (jose) |
| Validation | Zod (shared by API and forms)                                  |
| Editor     | Tiptap 3 (ProseMirror) rich-text editor                        |
| Styling    | Tailwind CSS 4 + Typography plugin                             |
| HTML safety| sanitize-html allow-list on every save                         |
| Link cards | Server-side Open Graph fetcher (cheerio) with DB cache + SSRF guard |

## Architecture

```
Browser ─┬─ Public website  (/ , /posts/[slug], /category/[slug], /tag/[slug], /search,
         │                    /sitemap.xml, /robots.txt, /feed.xml)
         │      Server Components → service layer → Prisma   (ISR-cached, revalidated on save)
         │
         └─ Admin panel     (/admin/**, protected by middleware)
                Client components → REST API (/api/admin/**) → service layer → Prisma

REST API
  /api/auth/{login,logout,me}
  /api/admin/posts            GET (search, filters, sort, pagination) · POST
  /api/admin/posts/:id        GET · PUT · DELETE
  /api/admin/posts/bulk       POST {ids, action: publish|draft|archive|delete}
  /api/admin/categories[/:id] /api/admin/tags[/:id]   CRUD
  /api/admin/media[/:id]      GET · POST (multipart) · PATCH (alt) · DELETE
  /api/admin/link-preview     GET ?url=
  /api/public/posts[/:slug]   /api/public/categories   (read-only, published only — for headless clients)
  /uploads/*                  uploaded files (immutable cache headers)
```

**Instant updates:** every admin mutation calls `revalidatePath("/", "layout")`, so cached public pages are rebuilt on the next request. Post pages are statically cached (ISR) and stay fast; changes show up immediately.

**Link previews:** in post content, a link on its own line becomes a rich card (image, title, description, site name). Inline external links are listed as cards under "Links in this post". Metadata is fetched server-side when you save, cached in the `LinkPreview` table (refreshed weekly) and never fetched from the visitor's browser. The fetcher blocks private and loopback addresses, non-standard ports and oversized responses, and it re-checks every redirect. The editor's **link card** button shows a preview before you insert one.

**Scheduling:** a post with status `PUBLISHED` and a future publish date is scheduled. It goes public automatically when that time passes.

### Folder structure

```
prisma/              schema.prisma (User, Post, Category, Tag, Media, LinkPreview), seed.ts
src/middleware.ts    auth guard for /admin + /api/admin, CSRF origin check
src/lib/             db, env, auth/jwt, api helpers, validation (zod), sanitize, slug, utils
src/lib/services/    posts, taxonomy, media, link-preview — all business logic lives here
src/lib/render-content.ts   turns stored HTML into render-ready HTML (link cards, lazy images)
src/app/(site)/      public website routes
src/app/admin/       admin panel: login, (panel)/dashboard|posts|media|categories|tags, preview
src/app/api/         REST endpoints (thin: auth → validate → service → revalidate)
src/components/ui    Button, Field, Input, Modal, ConfirmDialog, Toast…
src/components/admin PostEditor, RichEditor, PostsTable, MediaLibrary, TagInput, TaxonomyManager
src/components/site  SiteHeader, PostCard, PostArticle, Pagination…
```

## Getting started

Requires Node.js 20+.

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET and the admin credentials
npm run setup               # creates the database and seeds the admin user + sample content
npm run dev                 # http://localhost:3000  ·  admin at /admin
```

Production:

```bash
npm run build && npm start
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string |
| `SITE_URL` | Public origin; used for canonical URLs, the sitemap, RSS and OG tags |
| `SITE_NAME`, `SITE_DESCRIPTION` | Branding and default meta tags |
| `AUTH_SECRET` | ≥32 random chars for signing session JWTs (`openssl rand -base64 48`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | First admin account created by the seed |
| `UPLOAD_DIR` | Where uploaded media is stored (default `./uploads`) |
| `MAX_UPLOAD_MB` | Per-file upload limit (default 8) |

## Scaling to production

- **Database:** set `provider = "postgresql"` in `prisma/schema.prisma`, point `DATABASE_URL` at Postgres, then run `npx prisma migrate dev --name init` once and `npm run db:deploy` on deploy. Every list query is paginated and indexed (`status+publishedAt`, `categoryId`, `updatedAt`), so the admin and the site handle very large post counts. On Postgres, consider `mode: "insensitive"` or full-text search for the search queries.
- **Media:** uploads go to local disk (`UPLOAD_DIR`). On serverless or multi-instance hosting, replace `saveUpload`/`deleteMedia` in `src/lib/services/media.ts` with S3/R2 and return the bucket/CDN URL. Nothing else needs to change.
- **Rate limiting:** the login limiter is in-memory, which works for one instance. Use Redis or Upstash when you run several instances.
- **Security:** sessions are httpOnly, `SameSite=Lax` and `Secure` in production. Mutating API requests must come from the same origin. All HTML goes through an allow-list sanitizer. Uploads are checked by magic bytes, and SVG is rejected.
