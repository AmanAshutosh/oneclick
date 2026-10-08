"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, LoadingState, Modal } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, ClientApiError } from "@/lib/client-api";
import { cn, formatBytes, formatDate } from "@/lib/utils";

export type MediaItem = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
  _count?: { posts: number };
};
type ListResponse = { items: MediaItem[]; total: number; page: number; totalPages: number };

/** Upload one or more files to the media API. */
export async function uploadFiles(files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("file", f));
  return api<{ items: MediaItem[]; errors: string[] }>("/api/admin/media", { method: "POST", body: form });
}

export function MediaLibrary({ mode = "page", onSelect }: { mode?: "page" | "picker"; onSelect?: (m: MediaItem) => void }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<MediaItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: mode === "picker" ? "18" : "30" });
      if (query) qs.set("q", query);
      setData(await api<ListResponse>(`/api/admin/media?${qs}`));
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [page, query, mode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function handleFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await uploadFiles(files);
      toast(`Uploaded ${res.items.length} ${res.items.length === 1 ? "file" : "files"}`);
      res.errors.forEach((e) => toast(e, "error"));
      if (page !== 1) setPage(1);
      else await load();
      if (mode === "picker" && res.items.length === 1) onSelect?.(res.items[0]);
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn("relative", dragging && "after:pointer-events-none after:absolute after:inset-0 after:rounded-nm-lg after:border-2 after:border-dashed after:border-lime-ink after:bg-lime-soft/60")}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor={`media-search-${mode}`} className="sr-only">Search media</label>
        <Input id={`media-search-${mode}`} type="search" placeholder="Search by filename or alt text…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full sm:max-w-xs" />
        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="hidden text-xs text-ink/60 md:inline">Drag & drop images here, or</span>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" multiple className="sr-only" id={`media-upload-${mode}`} onChange={(e) => handleFiles(e.target.files)} />
          <Button variant="primary" loading={uploading} onClick={() => fileInput.current?.click()}>
            Upload images
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data && loading ? (
        <LoadingState label="Loading media…" />
      ) : data && data.items.length === 0 ? (
        <EmptyState title={query ? "No matching media" : "No media yet"} description="Upload JPEG, PNG, GIF, WebP or AVIF images." />
      ) : (
        <ul className={cn("grid gap-4 p-1 transition-opacity sm:gap-5", mode === "picker" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6", loading && "opacity-60")}>
          {data?.items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => (mode === "picker" ? onSelect?.(m) : setActive(m))}
                className="group block w-full rounded-nm bg-canvas p-1.5 text-left nm-raised-sm transition hover:-translate-y-0.5 active:translate-y-0 active:nm-inset-sm"
                aria-label={`${mode === "picker" ? "Select" : "Edit"} ${m.filename}`}
              >
                <span className="block aspect-square overflow-hidden rounded-[0.9rem] bg-canvas-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt ?? ""} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                </span>
                {mode === "page" && <span className="block truncate px-2 pt-2 pb-1 text-xs font-medium text-ink/65">{m.filename}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-ink/65 tabular-nums">Page {page} of {data.totalPages}</span>
          <Button size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {mode === "page" && active && (
        <MediaDetails
          item={active}
          onClose={() => setActive(null)}
          onChanged={() => {
            setActive(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function MediaDetails({ item, onClose, onChanged }: { item: MediaItem; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [alt, setAlt] = useState(item.alt ?? "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/admin/media/${item.id}`, { method: "PATCH", json: { alt } });
      toast("Alt text saved");
      onChanged();
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api(`/api/admin/media/${item.id}`, { method: "DELETE" });
      toast("Media deleted");
      onChanged();
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Delete failed", "error");
      setDeleting(false);
    }
  }

  const absoluteUrl = typeof window !== "undefined" ? new URL(item.url, window.location.origin).toString() : item.url;

  return (
    <>
      <Modal
        open={!confirming}
        onClose={onClose}
        title="Media details"
        size="xl"
        footer={
          <>
            <Button variant="danger" className="mr-auto" onClick={() => setConfirming(true)}>Delete</Button>
            <Button onClick={onClose}>Close</Button>
            <Button variant="primary" loading={saving} onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-5">
          <div className="well flex items-center justify-center overflow-hidden p-3 md:col-span-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt ?? ""} className="max-h-[55dvh] w-auto rounded-xl object-contain" />
          </div>
          <div className="space-y-4 md:col-span-2">
            <dl className="grid grid-cols-3 gap-y-2.5 text-sm">
              <dt className="font-medium text-ink/55">File</dt>
              <dd className="col-span-2 break-all">{item.filename}</dd>
              <dt className="font-medium text-ink/55">Type</dt>
              <dd className="col-span-2">{item.mimeType}</dd>
              <dt className="font-medium text-ink/55">Size</dt>
              <dd className="col-span-2">{formatBytes(item.size)}</dd>
              {item.width && (
                <>
                  <dt className="font-medium text-ink/55">Dimensions</dt>
                  <dd className="col-span-2">{item.width} × {item.height}</dd>
                </>
              )}
              <dt className="font-medium text-ink/55">Uploaded</dt>
              <dd className="col-span-2">{formatDate(item.createdAt)}</dd>
              <dt className="font-medium text-ink/55">Used by</dt>
              <dd className="col-span-2">{item._count?.posts ?? 0} post(s) as featured image</dd>
            </dl>
            <Field label="Alt text" hint="Describe the image for screen readers and SEO.">
              {(id, d) => <Input id={id} aria-describedby={d} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />}
            </Field>
            <Field label="File URL">
              {(id) => (
                <div className="flex gap-3">
                  <Input id={id} readOnly value={absoluteUrl} onFocus={(e) => e.currentTarget.select()} />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(absoluteUrl).then(() => toast("URL copied", "info"));
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </Field>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="Delete media"
        message={
          <>
            Delete <strong>{item.filename}</strong>? {item._count?.posts ? `It is the featured image of ${item._count.posts} post(s); they will have no featured image.` : ""} Images
            embedded in post content will break.
          </>
        }
        loading={deleting}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </>
  );
}

export function MediaPickerModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (m: MediaItem) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Choose an image" size="xl">
      <MediaLibrary
        mode="picker"
        onSelect={(m) => {
          onSelect(m);
          onClose();
        }}
      />
    </Modal>
  );
}
