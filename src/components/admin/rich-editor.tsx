"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { useState } from "react";
import { Button, Field, Input, Modal, Spinner } from "@/components/ui/primitives";
import { api, ClientApiError } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { MediaPickerModal } from "./media-library";

type Preview = { url: string; title: string | null; description: string | null; image: string | null; siteName: string | null; ok: boolean };

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: "Start writing… Paste a URL on its own line to create a link preview card." }),
    ],
    content: value,
    editorProps: { attributes: { class: "tiptap", "aria-label": "Post content", role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="rounded-nm-lg border border-transparent bg-canvas nm-inset transition focus-within:border-lime focus-within:ring-3 focus-within:ring-lime/35">
      {editor ? <Toolbar editor={editor} /> : <div className="m-2 h-12 rounded-2xl bg-canvas nm-raised-xs" />}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="flex min-h-[420px] items-center justify-center text-sm text-ink/55">
          <Spinner className="h-4 w-4" /> <span className="ml-2">Loading editor…</span>
        </div>
      )}
    </div>
  );
}

function ToolButton({ active, label, onClick, children, disabled }: { active?: boolean; label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold text-ink/75 transition hover:text-ink hover:nm-raised-xs disabled:opacity-35 disabled:hover:nm-flat",
        active && "bg-lime text-ink nm-inset-sm hover:nm-inset-sm",
      )}
    >
      {children}
    </button>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const c = () => editor.chain().focus();
  const Sep = () => <span aria-hidden className="mx-1.5 h-5 w-px bg-ink/15" />;

  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-20 z-10 m-2 flex flex-wrap items-center gap-1 rounded-2xl bg-canvas px-2 py-1.5 nm-raised-sm lg:top-3">
      <ToolButton label="Bold (Ctrl+B)" active={s.bold} onClick={() => c().toggleBold().run()}><b>B</b></ToolButton>
      <ToolButton label="Italic (Ctrl+I)" active={s.italic} onClick={() => c().toggleItalic().run()}><i className="font-serif">I</i></ToolButton>
      <ToolButton label="Underline (Ctrl+U)" active={s.underline} onClick={() => c().toggleUnderline().run()}><u>U</u></ToolButton>
      <ToolButton label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()}><s>S</s></ToolButton>
      <ToolButton label="Inline code" active={s.code} onClick={() => c().toggleCode().run()}><Icon d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></ToolButton>
      <Sep />
      <ToolButton label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
      <ToolButton label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</ToolButton>
      <ToolButton label="Bullet list" active={s.bullet} onClick={() => c().toggleBulletList().run()}><Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}><Icon d="M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3" /></ToolButton>
      <ToolButton label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Icon d="M7 7h4v4H8a1 1 0 0 0-1 1v3M14 7h4v4h-3a1 1 0 0 0-1 1v3" /></ToolButton>
      <ToolButton label="Code block" active={s.codeBlock} onClick={() => c().toggleCodeBlock().run()}><Icon d="M4 4h16v16H4zM9 9l-2 3 2 3M15 9l2 3-2 3" /></ToolButton>
      <ToolButton label="Divider" onClick={() => c().setHorizontalRule().run()}><Icon d="M3 12h18" /></ToolButton>
      <Sep />
      <ToolButton label="Insert / edit link" active={s.link} onClick={() => setLinkOpen(true)}><Icon d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></ToolButton>
      <ToolButton label="Insert link preview card" onClick={() => setCardOpen(true)}><Icon d="M3 5h18v14H3zM3 10h18M7 14h6" /></ToolButton>
      <ToolButton label="Insert image" onClick={() => setMediaOpen(true)}><Icon d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" /></ToolButton>
      <Sep />
      <ToolButton label="Undo (Ctrl+Z)" disabled={!s.canUndo} onClick={() => c().undo().run()}><Icon d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" /></ToolButton>
      <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => c().redo().run()}><Icon d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h4" /></ToolButton>

      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
      <LinkCardDialog editor={editor} open={cardOpen} onClose={() => setCardOpen(false)} />
      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(m) => c().setImage({ src: m.url, alt: m.alt ?? "" }).run()}
      />
    </div>
  );
}

function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prefill with the current link when the dialog opens.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(null);
    }
  }

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return onClose();
    }
    const normalized = /^(https?:|mailto:|\/)/i.test(href) ? href : `https://${href}`;
    try {
      if (!normalized.startsWith("/")) new URL(normalized);
    } catch {
      return setError("Enter a valid URL");
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain.insertContent({ type: "text", text: normalized, marks: [{ type: "link", attrs: { href: normalized } }] }).run();
    } else {
      chain.setLink({ href: normalized }).run();
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link"
      footer={
        <>
          {editor.isActive("link") && (
            <Button
              variant="ghost"
              className="mr-auto !text-danger"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                onClose();
              }}
            >
              Remove link
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => apply()}>Apply</Button>
        </>
      }
    >
      <form onSubmit={apply}>
        <Field label="URL" error={error ?? undefined} hint="External links open in a new tab and appear as preview cards on the post.">
          {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} autoFocus placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  );
}

function LinkCardDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUrl("");
      setPreview(null);
      setError(null);
    }
  }

  async function fetchPreview(e?: React.FormEvent) {
    e?.preventDefault();
    const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await api<{ preview: Preview }>(`/api/admin/link-preview?url=${encodeURIComponent(target)}&refresh=1`);
      setPreview(res.preview);
      setUrl(target);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not fetch preview");
    } finally {
      setLoading(false);
    }
  }

  function insert() {
    if (!preview) return;
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "paragraph", content: [{ type: "text", text: preview.url, marks: [{ type: "link", attrs: { href: preview.url } }] }] },
        { type: "paragraph" },
      ])
      .run();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Insert link preview card"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!preview} onClick={insert}>Insert card</Button>
        </>
      }
    >
      <form onSubmit={fetchPreview} className="flex items-end gap-3">
        <div className="flex-1">
          <Field label="URL" error={error ?? undefined}>
            {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} autoFocus placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />}
          </Field>
        </div>
        <Button type="submit" loading={loading} disabled={!url.trim()} className={error ? "mb-5" : undefined}>Fetch</Button>
      </form>

      {preview && (
        <div className="mt-5">
          <p className="eyebrow mb-3">Preview</p>
          <div className="flex overflow-hidden rounded-nm bg-canvas nm-raised-sm">
            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt="" className="hidden h-auto w-40 shrink-0 object-cover sm:block" referrerPolicy="no-referrer" />
            )}
            <div className="min-w-0 p-4">
              <p className="line-clamp-2 font-semibold">{preview.title || preview.url}</p>
              {preview.description && <p className="mt-1 line-clamp-2 text-sm text-ink/70">{preview.description}</p>}
              <p className="mt-2 text-xs font-semibold tracking-wide text-lime-ink uppercase">{preview.siteName}</p>
            </div>
          </div>
          {!preview.ok && (
            <p className="mt-2 text-xs font-medium text-ink/70">
              No metadata found for this page. It will be shown as a regular link until metadata becomes available.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
