import Link from "next/link";

/** Server-rendered pagination using query-string links (crawlable, works without JS). */
export function Pagination({ page, totalPages, basePath, query = {} }: { page: number; totalPages: number; basePath: string; query?: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  const btn = "btn btn-sm min-w-10 px-3.5";

  return (
    <nav aria-label="Pagination" className="mt-16 flex flex-wrap items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${btn} btn-secondary`}>
          ← Newer
        </Link>
      ) : (
        <span className={`${btn} btn-secondary`} aria-disabled="true">
          ← Newer
        </span>
      )}
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-3">
          {i > 0 && sorted[i - 1] !== p - 1 && <span className="text-ink/40">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={`${btn} ${p === page ? "btn-primary" : "btn-secondary"}`}>
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${btn} btn-secondary`}>
          Older →
        </Link>
      ) : (
        <span className={`${btn} btn-secondary`} aria-disabled="true">
          Older →
        </span>
      )}
    </nav>
  );
}
