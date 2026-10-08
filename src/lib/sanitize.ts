import sanitizeHtml from "sanitize-html";

/** Whitelist-based sanitizer for editor HTML. Runs on every save. */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "blockquote", "code", "pre", "hr", "img", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      pre: ["class"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    // Relative /uploads/... image paths are allowed (no scheme).
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href);
        const base: Record<string, string> = { href };
        if (attribs.title) base.title = attribs.title;
        return {
          tagName,
          attribs: external ? { ...base, target: "_blank", rel: "noopener noreferrer nofollow" } : base,
        };
      },
    },
  }).trim();
}
