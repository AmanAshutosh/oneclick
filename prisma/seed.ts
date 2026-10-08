import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";

// Load .env when run via tsx (Next.js loads it automatically at runtime).
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const db = new PrismaClient();

const welcome = `
<p>Welcome to <strong>OneClick</strong> — a modern, full-stack CMS. Everything you see here was written in the admin panel and published instantly to this site.</p>
<h2>What you can do</h2>
<ul>
  <li>Write rich posts with headings, lists, quotes, code and images.</li>
  <li>Organise content with categories and tags.</li>
  <li>Upload media and pick featured images.</li>
  <li>Tune SEO titles, descriptions and canonical URLs per post.</li>
</ul>
<h2>Link previews</h2>
<p>Put a link on its own line and it becomes a rich preview card:</p>
<p><a href="https://nextjs.org/">https://nextjs.org/</a></p>
<p>Inline links like <a href="https://www.prisma.io/">Prisma</a> are listed as cards at the end of the post.</p>
<blockquote><p>Sign in at <code>/admin</code> to start writing.</p></blockquote>
`.trim();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "Site Admin";

  const admin = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), bio: "Editor-in-chief." },
  });

  const categories = [
    { name: "News", slug: "news", description: "Announcements and updates." },
    { name: "Guides", slug: "guides", description: "Step-by-step tutorials." },
    { name: "Engineering", slug: "engineering", description: "Deep dives on how things are built." },
  ];
  for (const c of categories) await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });

  const guides = await db.category.findUniqueOrThrow({ where: { slug: "guides" } });
  if (!(await db.post.findUnique({ where: { slug: "welcome-to-oneclick" } }))) {
    await db.post.create({
      data: {
        title: "Welcome to OneClick",
        slug: "welcome-to-oneclick",
        excerpt: "A quick tour of what this CMS can do — from rich editing to automatic link previews.",
        content: welcome,
        status: "PUBLISHED",
        publishedAt: new Date(),
        metaDescription: "A quick tour of OneClick CMS: rich editing, media, categories, tags, SEO and link previews.",
        author: { connect: { id: admin.id } },
        category: { connect: { id: guides.id } },
        tags: {
          connectOrCreate: [
            { where: { slug: "getting-started" }, create: { name: "Getting started", slug: "getting-started" } },
            { where: { slug: "cms" }, create: { name: "CMS", slug: "cms" } },
          ],
        },
      },
    });
  }

  console.log(`Seed complete. Admin login: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
