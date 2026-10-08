"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfirmDialog, EmptyState, ErrorState, Input, LoadingState, Select, StatusBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, ClientApiError } from "@/lib/client-api";
import { cn, formatDate } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  author: { name: string };
  category: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
  featuredImage: { url: string; alt: string | null } | null;
};
type ListResponse = { items: Row[]; total: number; page: number; pageSize: number; totalPages: number };

export function PostsTable({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();

  const filters = useMemo(
    () => ({
      q: sp.get("q") ?? "",
      status: sp.get("status") ?? "",
      categoryId: sp.get("categoryId") ?? "",
      tag: sp.get("tag") ?? "",
      sort: sp.get("sort") ?? "updatedAt",
      order: sp.get("order") ?? "desc",
      page: Number(sp.get("page") ?? 1) || 1,
      pageSize: Number(sp.get("pageSize") ?? 20) || 20,
    }),
    [sp],
  );

  const [search, setSearch] = useState(filters.q);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const setFilters = useCallback(
    (patch: Partial<typeof filters>) => {
      const next = new URLSearchParams(sp.toString());
      const merged = { ...filters, ...patch, page: patch.page ?? 1 };
      for (const [k, v] of Object.entries(merged)) {
        const isDefault = (k === "sort" && v === "updatedAt") || (k === "order" && v === "desc") || (k === "page" && v === 1) || (k === "pageSize" && v === 20);
        if (v === "" || isDefault) next.delete(k);
        else next.set(k, String(v));
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [filters, pathname, router, sp],
  );

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v !== "") qs.set(k, String(v));
    try {
      const res = await api<ListResponse>(`/api/admin/posts?${qs}`, { signal: ctrl.signal });
      setData(res);
      setSelected(new Set());
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(err instanceof ClientApiError ? err.message : "Failed to load posts");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the search box into the URL.
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters({ q: search }), 300);
    return () => clearTimeout(t);
  }, [search, filters.q, setFilters]);

  async function bulk(action: "publish" | "draft" | "archive" | "delete", ids: string[]) {
    setBusy(true);
    try {
      const { count } = await api<{ count: number }>("/api/admin/posts/bulk", { method: "POST", json: { ids, action } });
      const verb = { publish: "published", draft: "moved to drafts", archive: "archived", delete: "deleted" }[action];
      toast(`${count} ${count === 1 ? "post" : "posts"} ${verb}`);
      setConfirm(null);
      await load();
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const hasFilters = filters.q || filters.status || filters.categoryId || filters.tag;

  return (
    <div className="surface p-2 sm:p-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="post-search" className="sr-only">Search posts</label>
          <Input id="post-search" type="search" placeholder="Search by title, excerpt or slug…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full pl-11" />
          <svg className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink/50" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className="sm:w-36">
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select aria-label="Filter by category" value={filters.categoryId} onChange={(e) => setFilters({ categoryId: e.target.value })} className="sm:w-40">
            <option value="">All categories</option>
            <option value="none">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select
            aria-label="Sort"
            value={`${filters.sort}:${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(":");
              setFilters({ sort, order });
            }}
            className="col-span-2 sm:w-44"
          >
            <option value="updatedAt:desc">Recently updated</option>
            <option value="createdAt:desc">Newest created</option>
            <option value="publishedAt:desc">Publish date ↓</option>
            <option value="publishedAt:asc">Publish date ↑</option>
            <option value="title:asc">Title A–Z</option>
            <option value="title:desc">Title Z–A</option>
          </Select>
        </div>
      </div>

      {filters.tag && (
        <div className="mx-3 mb-3 flex items-center gap-2 px-1 text-sm text-ink/70 sm:mx-4">
          Tagged <span className="chip py-1 text-xs font-semibold">{filters.tag}</span>
          <button className="action" onClick={() => setFilters({ tag: "" })}>Clear</button>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="on-dark mx-1 mb-3 flex animate-rise flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-cream sm:mx-2">
          <span className="mr-2 flex items-center gap-2 font-semibold"><span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-lime px-1.5 text-xs text-ink tabular-nums">{selected.size}</span> selected</span>
          <Button size="sm" className="nm-dark-raised" onClick={() => bulk("publish", [...selected])} disabled={busy}>Publish</Button>
          <Button size="sm" className="nm-dark-raised" onClick={() => bulk("draft", [...selected])} disabled={busy}>Move to draft</Button>
          <Button size="sm" className="nm-dark-raised" onClick={() => bulk("archive", [...selected])} disabled={busy}>Archive</Button>
          <Button size="sm" variant="danger" className="nm-dark-raised" onClick={() => setConfirm({ ids: [...selected], title: `${selected.size} posts` })} disabled={busy}>Delete</Button>
          <button className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-cream/75 hover:text-lime" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Body */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data && loading ? (
        <LoadingState label="Loading posts…" />
      ) : rows.length === 0 ? (
        <div className="p-2 sm:p-3">
          <EmptyState
            title={hasFilters ? "No posts match these filters" : "No posts yet"}
            description={hasFilters ? "Try a different search or clear the filters." : "Write your first post to get started."}
            action={
              hasFilters ? (
                <Button onClick={() => { setSearch(""); setFilters({ q: "", status: "", categoryId: "", tag: "" }); }}>Clear filters</Button>
              ) : (
                <Link href="/admin/posts/new" className="btn btn-md btn-primary">New post</Link>
              )
            }
          />
        </div>
      ) : (
        <div className={cn("relative overflow-x-auto px-1 pb-1 transition-opacity sm:px-2", loading && "opacity-60")}>
          <table className="nm-table min-w-[720px]">
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all posts on this page" className="check" />
                </th>
                <th scope="col" className="!pl-2">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Category</th>
                <th scope="col">Author</th>
                <th scope="col">Date</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const live = p.status === "PUBLISHED" && p.publishedAt && new Date(p.publishedAt) <= new Date();
                return (
                  <tr key={p.id} className={cn("group", selected.has(p.id) && "!bg-lime-soft/60")}>
                    <td>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} className="check" />
                    </td>
                    <td className="max-w-[16rem] !pl-2 xl:max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-16 shrink-0 overflow-hidden rounded-xl bg-canvas-deep nm-inset-sm">
                          {p.featuredImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.featuredImage.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/posts/${p.id}`} className="block truncate font-semibold text-ink hover:text-lime-ink">{p.title}</Link>
                          <p className="truncate text-xs text-ink/55">/posts/{p.slug}{p.tags.length ? ` · ${p.tags.map((t) => t.name).join(", ")}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={p.status} publishedAt={p.publishedAt} /></td>
                    <td className="whitespace-nowrap text-ink/70">{p.category?.name ?? <span className="text-ink/40">—</span>}</td>
                    <td className="whitespace-nowrap text-ink/70">{p.author.name}</td>
                    <td className="whitespace-nowrap text-ink/70">
                      {p.publishedAt ? formatDate(p.publishedAt) : <span className="text-ink/50">Updated {formatDate(p.updatedAt)}</span>}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-0.5">
                        <Link href={`/admin/posts/${p.id}`} className="action">Edit</Link>
                        <a href={live ? `/posts/${p.slug}` : `/admin/preview/${p.id}`} target="_blank" rel="noreferrer" className="action">
                          {live ? "View" : "Preview"}
                        </a>
                        <button onClick={() => setConfirm({ ids: [p.id], title: `“${p.title}”` })} className="action action-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="mt-2 flex flex-col gap-3 px-3 pt-3 pb-2 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()}
            </span>
            <Select aria-label="Rows per page" value={filters.pageSize} onChange={(e) => setFilters({ pageSize: Number(e.target.value) })} className="h-9 w-auto rounded-full py-1.5">
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={data.page <= 1 || loading} onClick={() => setFilters({ page: data.page - 1 })}>Previous</Button>
            <span className="tabular-nums">Page {data.page} of {data.totalPages}</span>
            <Button size="sm" disabled={data.page >= data.totalPages || loading} onClick={() => setFilters({ page: data.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete posts"
        message={<>Permanently delete {confirm?.title}? This cannot be undone and the page will disappear from the website.</>}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && bulk("delete", confirm.ids)}
      />
    </div>
  );
}
