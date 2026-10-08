import { env } from "@/lib/env";
import { listPublishedPosts } from "@/lib/services/posts";
import { escapeHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { items } = await listPublishedPosts({ page: 1, pageSize: 30 });
  const base = env.siteUrl;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeHtml(env.siteName)}</title>
  <link>${base}/</link>
  <description>${escapeHtml(env.siteDescription)}</description>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${base}/posts/${p.slug}</link>
    <guid isPermaLink="true">${base}/posts/${p.slug}</guid>
    ${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
    ${p.excerpt ? `<description>${escapeHtml(p.excerpt)}</description>` : ""}
    ${p.category ? `<category>${escapeHtml(p.category.name)}</category>` : ""}
  </item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
