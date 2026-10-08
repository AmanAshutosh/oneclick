import Image from "next/image";
import Link from "next/link";
import type { PostFull } from "@/lib/services/posts";
import { renderPostContent } from "@/lib/render-content";
import { formatDate, readingTime } from "@/lib/utils";
import type { LinkPreviewData } from "@/lib/services/link-preview";

function LinkCard({ p }: { p: LinkPreviewData }) {
  const host = new URL(p.url).hostname.replace(/^www\./, "");
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className={`link-card !my-0 ${p.image ? "" : "link-card--no-media"}`}>
      {p.image && (
        <span className="link-card__media">
          {/* External thumbnails: arbitrary hosts, so a plain lazy <img> instead of next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        </span>
      )}
      <span className="link-card__body">
        <span className="link-card__title">{p.title || host}</span>
        {p.description && <span className="link-card__desc">{p.description}</span>}
        <span className="link-card__site">
          {p.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="link-card__favicon" src={p.favicon} alt="" width={16} height={16} loading="lazy" referrerPolicy="no-referrer" />
          )}
          {p.siteName || host}
        </span>
      </span>
    </a>
  );
}

/** Full article view, shared by the public post page and the admin preview. */
export async function PostArticle({ post }: { post: PostFull }) {
  const { html, inlineLinks } = await renderPostContent(post.content);
  const date = post.publishedAt ?? post.updatedAt;

  return (
    <article className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
      <header className="animate-rise text-center">
        {post.category && (
          <Link href={`/category/${post.category.slug}`} className="chip text-xs font-bold tracking-widest text-lime-ink uppercase">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
            {post.category.name}
          </Link>
        )}
        <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-ink/70 sm:text-xl">{post.excerpt}</p>}
        <div className="well mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl px-5 py-2.5 sm:rounded-full text-sm text-ink/65">
          <span className="flex items-center gap-2 font-semibold text-ink" rel="author">
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-[11px] font-bold">
              {post.author.name.charAt(0)}
            </span>
            {post.author.name}
          </span>
          <span aria-hidden className="text-ink/30">•</span>
          <time dateTime={date.toISOString()}>{formatDate(date, { dateStyle: "long" })}</time>
          <span aria-hidden className="text-ink/30">•</span>
          <span>{readingTime(post.content)} min read</span>
        </div>
      </header>

      {post.featuredImage && (
        <figure className="surface mt-12 p-2 sm:p-3">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt ?? ""}
            width={post.featuredImage.width ?? 1600}
            height={post.featuredImage.height ?? 900}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="w-full rounded-nm object-cover"
          />
        </figure>
      )}

      <div className="post-body mt-12" dangerouslySetInnerHTML={{ __html: html }} />

      {inlineLinks.length > 0 && (
        <section aria-labelledby="links-heading" className="mt-16">
          <h2 id="links-heading" className="eyebrow mb-6">
            Links in this post
          </h2>
          <div className="grid gap-6">
            {inlineLinks.map((l) => (
              <LinkCard key={l.url} p={l} />
            ))}
          </div>
        </section>
      )}

      {post.tags.length > 0 && (
        <footer className="mt-14">
          <h2 className="sr-only">Tags</h2>
          <ul className="flex flex-wrap gap-3">
            {post.tags.map((t) => (
              <li key={t.id}>
                <Link href={`/tag/${t.slug}`} className="chip">
                  <span className="text-lime-ink">#</span>
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      )}

      <aside className="surface mt-12 flex items-center gap-5 p-6">
        <div aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime font-display text-xl font-extrabold text-ink nm-raised-sm">
          {post.author.name.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-ink/55 uppercase">Written by</p>
          <p className="mt-0.5 font-display text-lg font-bold">{post.author.name}</p>
          {post.author.bio && <p className="mt-1 text-sm leading-relaxed text-ink/70">{post.author.bio}</p>}
        </div>
      </aside>
    </article>
  );
}
