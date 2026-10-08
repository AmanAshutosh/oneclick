import Link from "next/link";
import { PageHeader } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth";
import { dashboardStats } from "@/lib/services/posts";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), dashboardStats()]);
  const cards = [
    { label: "Published", value: stats.published, href: "/admin/posts?status=PUBLISHED" },
    { label: "Scheduled", value: stats.scheduled, href: "/admin/posts?status=PUBLISHED" },
    { label: "Drafts", value: stats.drafts, href: "/admin/posts?status=DRAFT" },
    { label: "Media files", value: stats.media, href: "/admin/media" },
    { label: "Categories", value: stats.categories, href: "/admin/categories" },
    { label: "Tags", value: stats.tags, href: "/admin/tags" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? ""}`}
        description="Here’s what’s happening with your site."
        actions={
          <Link href="/admin/posts/new" className="btn btn-md btn-primary">
            + New post
          </Link>
        }
      />

      <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className={
              i === 0
                ? "group rounded-nm-lg bg-lime p-5 text-ink nm-raised transition hover:-translate-y-0.5 active:translate-y-0 active:nm-inset"
                : "group surface p-5 transition hover:-translate-y-0.5 active:translate-y-0 active:nm-inset"
            }
          >
            <dt className={i === 0 ? "text-sm font-semibold text-ink/75" : "text-sm font-semibold text-ink/60"}>{c.label}</dt>
            <dd className="mt-2 font-display text-4xl font-extrabold tracking-tight tabular-nums">{c.value}</dd>
          </Link>
        ))}
      </dl>

      <section className="surface mt-10 p-2 sm:p-3">
        <div className="flex items-center justify-between px-4 pt-3 pb-4 sm:px-5">
          <h2 className="text-lg font-bold">Recently updated</h2>
          <Link href="/admin/posts" className="action text-sm">
            All posts →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="well mx-2 mb-2 px-5 py-10 text-center text-sm text-ink/60">No posts yet.</p>
        ) : (
          <ul className="well space-y-1 p-2">
            {stats.recent.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 rounded-2xl px-4 py-3 transition hover:bg-cream/70 sm:flex-row sm:items-center sm:gap-4">
                <Link href={`/admin/posts/${p.id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-lime-ink">
                  {p.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-ink/60">
                  <StatusBadge status={p.status} publishedAt={p.publishedAt} />
                  <span>{formatDate(p.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
