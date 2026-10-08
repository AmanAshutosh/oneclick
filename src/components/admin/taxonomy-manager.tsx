"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, LoadingState, Modal, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, ClientApiError, type FieldErrors } from "@/lib/client-api";

type Item = { id: string; name: string; slug: string; description?: string | null; _count: { posts: number } };

/** CRUD UI shared by categories and tags. */
export function TaxonomyManager({ kind }: { kind: "categories" | "tags" }) {
  const toast = useToast();
  const singular = kind === "categories" ? "category" : "tag";
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems((await api<{ items: Item[] }>(`/api/admin/${kind}`)).items);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Failed to load");
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      const json = { name: editing.name ?? "", slug: editing.slug ?? "", ...(kind === "categories" ? { description: editing.description ?? "" } : {}) };
      await api(editing.id ? `/api/admin/${kind}/${editing.id}` : `/api/admin/${kind}`, { method: editing.id ? "PUT" : "POST", json });
      toast(editing.id ? `${singular} updated` : `${singular} created`);
      setEditing(null);
      load();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { name: [err.message] });
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/${kind}/${deleting.id}`, { method: "DELETE" });
      toast(`${singular} deleted`);
      setDeleting(null);
      load();
    } catch (err) {
      toast(err instanceof ClientApiError ? err.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const visible = items?.filter((i) => !filter || i.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="surface p-2 sm:p-3">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
        <label htmlFor="tax-filter" className="sr-only">Filter</label>
        <Input id="tax-filter" type="search" placeholder={`Filter ${kind}…`} value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full sm:max-w-xs" />
        <Button
          variant="primary"
          className="sm:ml-auto"
          onClick={() => {
            setErrors({});
            setEditing({});
          }}
        >
          + Add {singular}
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !visible ? (
        <LoadingState label="Loading…" />
      ) : visible.length === 0 ? (
        <div className="p-2 sm:p-3"><EmptyState title={filter ? `No ${kind} match` : `No ${kind} yet`} /></div>
      ) : (
        <div className="overflow-x-auto px-1 pb-1 sm:px-2">
          <table className="nm-table min-w-[520px]">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col" className="text-right">Posts</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr key={i.id}>
                  <td>
                    <p className="font-semibold">{i.name}</p>
                    {i.description && <p className="line-clamp-1 text-xs text-ink/55">{i.description}</p>}
                  </td>
                  <td className="text-ink/65"><code className="rounded-lg bg-canvas-deep px-2 py-0.5 text-xs">{i.slug}</code></td>
                  <td className="text-right tabular-nums">
                    <a href={`/admin/posts?${kind === "categories" ? `categoryId=${i.id}` : `tag=${i.slug}`}`} className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-canvas px-2.5 text-xs font-bold nm-raised-xs transition hover:bg-lime">{i._count.posts}</a>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <a href={`/${kind === "categories" ? "category" : "tag"}/${i.slug}`} target="_blank" rel="noreferrer" className="action">View</a>
                    <button onClick={() => { setErrors({}); setEditing(i); }} className="action">Edit</button>
                    <button onClick={() => setDeleting(i)} className="action action-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${singular}` : `New ${singular}`}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => save()}>Save</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-5">
          <Field label="Name" error={errors.name}>
            {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} autoFocus value={editing?.name ?? ""} onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))} />}
          </Field>
          <Field label="Slug" error={errors.slug} hint="Leave empty to generate from the name.">
            {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} value={editing?.slug ?? ""} onChange={(e) => setEditing((x) => ({ ...x, slug: e.target.value.toLowerCase() }))} />}
          </Field>
          {kind === "categories" && (
            <Field label="Description" error={errors.description}>
              {(id, d, invalid) => <Textarea id={id} aria-describedby={d} invalid={invalid} rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))} />}
            </Field>
          )}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${singular}`}
        message={<>Delete “{deleting?.name}”? {deleting?._count.posts ? `${deleting._count.posts} post(s) will be ${kind === "categories" ? "left uncategorized" : "untagged"}.` : ""}</>}
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
