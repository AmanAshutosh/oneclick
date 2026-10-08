import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";

export type LinkPreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  ok: boolean;
};

const FRESH_MS = 7 * 24 * 60 * 60 * 1000; // successful previews: 7 days
const RETRY_MS = 6 * 60 * 60 * 1000; // failed fetches: retry after 6 hours
const TIMEOUT_MS = 5000;
const MAX_BYTES = 768 * 1024;
const MAX_REDIRECTS = 4;

/* ----------------------------------------------------------------------------
 * SSRF protection: only fetch public http(s) hosts on standard ports.
 * ------------------------------------------------------------------------- */

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
  if (url.username || url.password) throw new Error("Credentials in URL not allowed");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Non-standard port");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private host");
  }
  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) throw new Error("Private address");
  return url;
}

async function fetchHtml(raw: string): Promise<{ html: string; finalUrl: string }> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OneClickCMS-LinkPreview/1.0; +https://github.com)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "accept-language": "en",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect without location");
      current = new URL(location, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) throw new Error("Not HTML");
    return { html: await readLimited(res), finalUrl: url.toString() };
  }
  throw new Error("Too many redirects");
}

async function readLimited(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

function absolutize(value: string | undefined | null, base: string): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim(), base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function clean(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

export function parseMetadata(html: string, pageUrl: string): Omit<LinkPreviewData, "url" | "ok"> {
  const $ = cheerio.load(html);
  const meta = (...keys: string[]) => {
    for (const key of keys) {
      const v = $(`meta[property="${key}"]`).attr("content") ?? $(`meta[name="${key}"]`).attr("content");
      if (v?.trim()) return v;
    }
    return undefined;
  };
  const host = new URL(pageUrl).hostname.replace(/^www\./, "");
  return {
    title: clean(meta("og:title", "twitter:title") ?? $("title").first().text(), 200),
    description: clean(meta("og:description", "twitter:description", "description"), 300),
    image: absolutize(meta("og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"), pageUrl),
    siteName: clean(meta("og:site_name", "application-name"), 80) ?? host,
    favicon:
      absolutize($('link[rel="icon"]').attr("href") ?? $('link[rel="shortcut icon"]').attr("href") ?? $('link[rel="apple-touch-icon"]').attr("href"), pageUrl) ??
      absolutize("/favicon.ico", pageUrl),
  };
}

/* ----------------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------------- */

const inflight = new Map<string, Promise<LinkPreviewData>>();

function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** Returns cached metadata, refreshing it from the network when stale. Never throws. */
export async function getLinkPreview(rawUrl: string, opts: { force?: boolean } = {}): Promise<LinkPreviewData | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  const cached = await db.linkPreview.findUnique({ where: { url } });
  if (cached && !opts.force) {
    const age = Date.now() - cached.fetchedAt.getTime();
    if (age < (cached.ok ? FRESH_MS : RETRY_MS)) return cached;
  }

  let pending = inflight.get(url);
  if (!pending) {
    pending = refresh(url).finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }
  return pending;
}

async function refresh(url: string): Promise<LinkPreviewData> {
  let data: LinkPreviewData;
  try {
    const { html, finalUrl } = await fetchHtml(url);
    data = { url, ok: true, ...parseMetadata(html, finalUrl) };
    if (!data.title && !data.description && !data.image) data.ok = false;
  } catch {
    data = { url, ok: false, title: null, description: null, image: null, siteName: new URL(url).hostname.replace(/^www\./, ""), favicon: null };
  }
  await db.linkPreview.upsert({ where: { url }, create: { ...data, fetchedAt: new Date() }, update: { ...data, fetchedAt: new Date() } }).catch(() => {});
  return data;
}

/** Fetch previews in the background (e.g. right after a post is saved). */
export function warmLinkPreviews(urls: string[]) {
  for (const u of urls.slice(0, 25)) void getLinkPreview(u).catch(() => {});
}

export function extractExternalLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/^https?:\/\//i.test(href)) {
      const n = normalizeUrl(href);
      if (n) urls.add(n);
    }
  });
  return [...urls];
}
