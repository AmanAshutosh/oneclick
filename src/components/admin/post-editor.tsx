"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, ConfirmDialog, Field, Input, Select, StatusBadge, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, ClientApiError, type FieldErrors } from "@/lib/client-api";
import { toLocalInput, type EditorPost, type PostStatusValue } from "@/lib/post-form";
import { slugify } from "@/lib/slug";
import { stripHtml, truncate } from "@/lib/utils";
import { MediaPickerModal } from "./media-library";
import { RichEditor } from "./rich-editor";
import { TagInput } from "./tag-input";

type Status = PostStatusValue;

export function PostEditor({
  initial,
  categories,
  tagSuggestions,
  siteUrl,
}: {
  initial: EditorPost;
  categories: { id: string; name: string }[];
  tagSuggestions: string[];
  siteUrl: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [post, setPost] = useState<EditorPost>(initial);
  const [savedPost, setSavedPost] = useState<EditorPost>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<null | "save" | "publish" | "preview">(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isNew = !post.id;

  useEffect(() => {
    const local = toLocalInput(initial.publishedAt);
    setPost((p) => ({ ...p, publishedAt: local }));
    setSavedPost((p) => ({ ...p, publishedAt: local }));
  }, [initial.publishedAt]);
  const dirty = JSON.stringify(post) !== JSON.stringify(savedPost);

  const set = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => {
    setPost((p) => ({ ...p, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Auto-generate slug from title until the user edits it.
  useEffect(() => {
    if (!slugTouched) setPost((p) => ({ ...p, slug: p.title ? slugify(p.title) : "" }));
  }, [post.title, slugTouched]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = useCallback(
    async (intent: "save" | "publish" | "preview", statusOverride?: Status) => {
      const status = statusOverride ?? post.status;
      const clientErrors: FieldErrors = {};
      if (!post.title.trim()) clientErrors.title = ["Title is required"];
      if (status === "PUBLISHED" && !stripHtml(post.content)) clientErrors.content = ["Add some content before publishing"];
      if (Object.keys(clientErrors).length) {
        setErrors(clientErrors);
        setFormError("Please fix the highlighted fields");
        return;
      }

      // Open the preview tab synchronously (avoids popup blockers), navigate it once saved.
      const previewWin = intent === "preview" ? window.open("about:blank", "_blank") : null;

      setSaving(intent);
      setFormError(null);
      setErrors({});
      const payload = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        status,
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
        categoryId: post.categoryId || null,
        tags: post.tags,
        featuredImageId: post.featuredImage?.id ?? null,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        canonicalUrl: post.canonicalUrl,
        noIndex: post.noIndex,
      };
      try {
        const res = await api<{ post: { id: string; slug: string; status: Status; publishedAt: string | null; content: string } }>(
          isNew ? "/api/admin/posts" : `/api/admin/posts/${post.id}`,
          { method: isNew ? "POST" : "PUT", json: payload },
        );
        const next: EditorPost = {
          ...post,
          id: res.post.id,
          slug: res.post.slug,
          status: res.post.status,
          publishedAt: toLocalInput(res.post.publishedAt),
        };
        setPost(next);
        setSavedPost(next);
        setSlugTouched(true);

        if (previewWin) previewWin.location.href = `/admin/preview/${res.post.id}`;
        const live = res.post.status === "PUBLISHED" && res.post.publishedAt && new Date(res.post.publishedAt) <= new Date();
        toast(
          intent === "publish"
            ? live ? "Published — it’s live on the website" : "Scheduled for publishing"
            : intent === "preview" ? "Saved — opening preview" : "Changes saved",
        );
        if (isNew) router.replace(`/admin/posts/${res.post.id}`);
        router.refresh();
      } catch (err) {
        previewWin?.close();
        if (err instanceof ClientApiError) {
          setFormError(err.message);
          setErrors(err.fieldErrors);
        } else setFormError("Something went wrong while saving");
        toast("Save failed", "error");
      } finally {
        setSaving(null);
      }
    },
    [post, isNew, router, toast],
  );

  // Ctrl/Cmd + S to save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) save("save");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, saving]);

  async function remove() {
    if (!post.id) return;
    setDeleting(true);
    try {
      await api(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      setSavedPost(post); // suppress unsaved-changes prompt
      toast("Post deleted");
      router.replace("/admin/posts");
      router.refresh();
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Delete failed", "error");
      setDeleting(false);
    }
  }

  const isLive = savedPost.status === "PUBLISHED" && savedPost.publishedAt && new Date(savedPost.publishedAt) <= new Date();
  const seoTitle = post.metaTitle || post.title || "Post title";
  const seoDesc = post.metaDescription || post.excerpt || truncate(stripHtml(post.content), 160) || "Add a meta description to control how this post appears in search results.";

  return (
    <div>
      {/* Header bar */}
      <div className="mb-8 flex animate-rise flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/posts" className="btn btn-secondary h-10 w-10" aria-label="Back to posts">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{isNew ? "New post" : "Edit post"}</h1>
          {!isNew && <StatusBadge status={savedPost.status} publishedAt={savedPost.publishedAt || null} />}
          {dirty && (
            <span className="flex items-center gap-1.5 rounded-full bg-lime-soft px-2.5 py-1 text-xs font-semibold text-lime-ink">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-ink" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save("preview")} loading={saving === "preview"} disabled={!!saving}>Preview</Button>
          {savedPost.status !== "PUBLISHED" || isNew ? (
            <>
              <Button onClick={() => save("save", "DRAFT")} loading={saving === "save"} disabled={!!saving}>Save draft</Button>
              <Button variant="primary" onClick={() => save("publish", "PUBLISHED")} loading={saving === "publish"} disabled={!!saving}>
                {post.publishedAt && new Date(post.publishedAt) > new Date() ? "Schedule" : "Publish"}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => save("save", "DRAFT")} disabled={!!saving}>Unpublish</Button>
              <Button variant="primary" onClick={() => save("save")} loading={saving === "save"} disabled={!!saving}>Update</Button>
            </>
          )}
        </div>
      </div>

      {formError && (
        <div role="alert" className="well mb-6 flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-danger">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-danger" />
          {formError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Field label="Title" error={errors.title}>
            {(id, d, invalid) => (
              <Input
                id={id}
                aria-describedby={d}
                invalid={invalid}
                value={post.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="An attention-grabbing title"
                maxLength={200}
                className="h-14 font-display text-xl font-bold"
              />
            )}
          </Field>

          <Field
            label="URL slug"
            error={errors.slug}
            hint={<>{siteUrl.replace(/^https?:\/\//, "")}/posts/<strong>{post.slug || "…"}</strong></>}
          >
            {(id, d, invalid) => (
              <Input
                id={id}
                aria-describedby={d}
                invalid={invalid}
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-"));
                }}
                onBlur={() => set("slug", post.slug.replace(/^-+|-+$/g, ""))}
                placeholder="auto-generated-from-title"
              />
            )}
          </Field>

          <div className="space-y-2">
            <span className="block px-1 text-sm font-semibold text-ink">Content</span>
            <RichEditor value={post.content} onChange={(html) => set("content", html)} />
            {errors.content && <p className="px-1 text-xs font-medium text-danger">{errors.content[0]}</p>}
          </div>

          <Field label="Excerpt" error={errors.excerpt} hint="Shown on post cards and used as a fallback meta description." counter={{ value: post.excerpt.length, max: 500 }}>
            {(id, d, invalid) => <Textarea id={id} aria-describedby={d} invalid={invalid} rows={3} value={post.excerpt} onChange={(e) => set("excerpt", e.target.value)} />}
          </Field>

          {/* SEO */}
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Search engine optimisation</h2>
            <div className="well mb-6 p-5" aria-label="Search result preview">
              <p className="truncate text-xs text-ink/60">{siteUrl.replace(/^https?:\/\//, "")} › posts › {post.slug || "…"}</p>
              <p className="mt-1 truncate font-display text-lg font-bold text-ink">{truncate(seoTitle, 65)}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink/70">{truncate(seoDesc, 165)}</p>
            </div>
            <div className="space-y-4">
              <Field label="Meta title" error={errors.metaTitle} hint="Defaults to the post title." counter={{ value: post.metaTitle.length, max: 70 }}>
                {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} value={post.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={post.title} />}
              </Field>
              <Field label="Meta description" error={errors.metaDescription} hint="Ideally 120–160 characters." counter={{ value: post.metaDescription.length, max: 170 }}>
                {(id, d, invalid) => <Textarea id={id} aria-describedby={d} invalid={invalid} rows={2} value={post.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />}
              </Field>
              <Field label="Canonical URL" error={errors.canonicalUrl} hint="Only set this if the post was originally published elsewhere.">
                {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} type="url" value={post.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://" />}
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={post.noIndex} onChange={(e) => set("noIndex", e.target.checked)} className="check" />
                Hide from search engines (noindex)
              </label>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Publishing</h2>
            <Field label="Status" error={errors.status}>
              {(id) => (
                <Select id={id} value={post.status} onChange={(e) => set("status", e.target.value as Status)}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              )}
            </Field>
            <Field label="Publish date" error={errors.publishedAt} hint="Set a future date to schedule. Leave empty to use the time you publish.">
              {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} type="datetime-local" value={post.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />}
            </Field>
            {!isNew && isLive && (
              <a href={`/posts/${savedPost.slug}`} target="_blank" rel="noreferrer" className="action -ml-3 text-sm text-lime-ink">
                View live post ↗
              </a>
            )}
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Organisation</h2>
            <Field label="Category" error={errors.categoryId} hint={categories.length === 0 ? <Link className="underline" href="/admin/categories">Create a category</Link> : undefined}>
              {(id, d, invalid) => (
                <Select id={id} aria-describedby={d} invalid={invalid} value={post.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <TagInput value={post.tags} onChange={(tags) => set("tags", tags)} suggestions={tagSuggestions} error={errors.tags?.[0]} />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Featured image</h2>
            {post.featuredImage ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.featuredImage.url} alt={post.featuredImage.alt ?? ""} className="aspect-[16/10] w-full rounded-nm object-cover nm-raised-sm" />
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setPickerOpen(true)}>Replace</Button>
                  <Button size="sm" variant="ghost" className="!text-danger" onClick={() => set("featuredImage", null)}>Remove</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="well flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 text-sm font-semibold text-ink/60 transition hover:text-ink"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink nm-raised-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" /></svg>
                </span>
                Choose or upload image
              </button>
            )}
            {errors.featuredImageId && <p className="mt-2 px-1 text-xs font-medium text-danger">{errors.featuredImageId[0]}</p>}
          </Card>

          {!isNew && (
            <Button variant="ghost" className="w-full !text-danger" onClick={() => setConfirmDelete(true)}>
              Delete post
            </Button>
          )}
        </aside>
      </div>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(m) => set("featuredImage", { id: m.id, url: m.url, alt: m.alt })} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete post"
        message={<>Permanently delete “{savedPost.title}”? This cannot be undone.</>}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
}
