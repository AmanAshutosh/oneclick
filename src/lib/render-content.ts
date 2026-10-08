import "server-only";
import * as cheerio from "cheerio";
import { env } from "@/lib/env";
import { escapeHtml } from "@/lib/utils";
import { getLinkPreview, type LinkPreviewData } from "@/lib/services/link-preview";

function isExternal(href: string) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host !== new URL(env.siteUrl).host;
  } catch {
    return false;
  }
}

export function linkCardHtml(p: LinkPreviewData, href: string) {
  const host = (() => {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  })();
  const title = escapeHtml(p.title || host);
  const desc = p.description ? `<span class="link-card__desc">${escapeHtml(p.description)}</span>` : "";
  const img = p.image
    ? `<span class="link-card__media"><img src="${escapeHtml(p.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
    : "";
  const fav = p.favicon
    ? `<img class="link-card__favicon" src="${escapeHtml(p.favicon)}" alt="" width="16" height="16" loading="lazy" referrerpolicy="no-referrer">`
    : "";
  return (
    `<a class="not-prose link-card${p.image ? "" : " link-card--no-media"}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">` +
    img +
    `<span class="link-card__body"><span class="link-card__title">${title}</span>${desc}` +
    `<span class="link-card__site">${fav}${escapeHtml(p.siteName || host)}</span></span></a>`
  );
}

/**
 * Turns stored post HTML into render-ready HTML:
 *  - paragraphs that contain only an external link become rich link-preview cards
 *  - all other external links are collected so the page can show them as cards too
 */
export async function renderPostContent(html: string): Promise<{ html: string; inlineLinks: LinkPreviewData[] }> {
  const $ = cheerio.load(html, null, false);

  const standalone: { el: cheerio.Cheerio<any>; href: string }[] = [];
  $("p").each((_, p) => {
    const $p = $(p);
    const links = $p.find("a[href]");
    if (links.length !== 1) return;
    const href = links.attr("href") ?? "";
    if (!isExternal(href)) return;
    if ($p.text().trim() !== links.text().trim()) return; // link is part of a sentence
    standalone.push({ el: $p, href });
  });

  const inlineHrefs = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    if (isExternal(href) && !standalone.some((s) => s.href === href)) inlineHrefs.add(href);
  });

  const [cards, inline] = await Promise.all([
    Promise.all(standalone.map((s) => getLinkPreview(s.href))),
    Promise.all([...inlineHrefs].slice(0, 12).map((h) => getLinkPreview(h))),
  ]);

  standalone.forEach((s, i) => {
    const data = cards[i];
    if (data?.ok) s.el.replaceWith(linkCardHtml(data, s.href));
  });

  // Lazy-load inline images.
  $("img").attr("loading", "lazy").attr("decoding", "async");

  return { html: $.html(), inlineLinks: inline.filter((d): d is LinkPreviewData => !!d && d.ok) };
}
