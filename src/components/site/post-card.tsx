import Image from "next/image";
import Link from "next/link";
import type { PostListItem } from "@/lib/services/posts";
import { cn, formatDate } from "@/lib/utils";

export function PostCard({ post, featured = false, priority = false }: { post: PostListItem; featured?: boolean; priority?: boolean }) {
  const href = `/posts/${post.slug}`;
  return (
    <article
      className={cn(
        "group surface relative flex flex-col p-3 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[14px_14px_30px_var(--nm-dark-strong),-12px_-12px_28px_var(--nm-light)] has-[h2_a:focus-visible]:-translate-y-1 has-[h2_a:focus-visible]:outline-2 has-[h2_a:focus-visible]:outline-offset-4 has-[h2_a:focus-visible]:outline-ink",
        featured && "md:grid md:grid-cols-5 md:items-center md:gap-4 md:p-4",
      )}
    >
      <div className={cn("relative overflow-hidden rounded-nm bg-canvas-deep nm-inset-sm", featured ? "aspect-[16/10] md:col-span-3" : "aspect-[16/10]")}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt ?? ""}
            fill
            priority={priority}
            sizes={featured ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center bg-canvas nm-inset">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-lime font-display text-4xl font-extrabold text-ink nm-raised-sm">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col px-3 pt-5 pb-3", featured && "md:col-span-2 md:px-6 md:py-4")}>
        {(featured || post.category) && (
          <div className="flex flex-wrap items-center gap-2">
            {featured && <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-wider text-cream uppercase">Featured</span>}
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 rounded-full bg-lime-soft px-3 py-1 text-[11px] font-bold tracking-wider text-lime-ink uppercase transition hover:bg-lime hover:text-ink"
              >
                {post.category.name}
              </Link>
            )}
          </div>
        )}
        <h2 className={cn("mt-3 font-extrabold tracking-tight text-ink", featured ? "text-3xl leading-tight sm:text-4xl" : "text-xl leading-snug")}>
          <Link href={href} className="after:absolute after:inset-0 after:rounded-nm-lg focus-visible:outline-none">
            <span className="bg-[linear-gradient(var(--color-lime),var(--color-lime))] bg-[length:0%_35%] box-decoration-clone bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_35%]">
              {post.title}
            </span>
          </Link>
        </h2>
        {post.excerpt && <p className={cn("mt-3 text-ink/70", featured ? "line-clamp-3 text-lg leading-relaxed" : "line-clamp-2 text-[15px] leading-relaxed")}>{post.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2.5 pt-5 text-sm text-ink/60">
          <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-bold text-ink nm-raised-xs">
            {post.author.name.charAt(0)}
          </span>
          <span className="font-semibold text-ink/80">{post.author.name}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function PostGrid({ posts }: { posts: PostListItem[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
