// Shared (server + client) shapes for the post editor form.

export type PostStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type EditorPost = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PostStatusValue;
  /** ISO string when passed from the server; datetime-local value inside the editor. */
  publishedAt: string;
  categoryId: string;
  tags: string[];
  featuredImage: { id: string; url: string; alt: string | null } | null;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
};

export const emptyPost: EditorPost = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  status: "DRAFT",
  publishedAt: "",
  categoryId: "",
  tags: [],
  featuredImage: null,
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  noIndex: false,
};

/** Converts a date to an <input type="datetime-local"> value in the *browser's* local time. */
export function toLocalInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
}
