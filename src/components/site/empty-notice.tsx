import { cn } from "@/lib/utils";

/** Server-safe empty state for public pages. */
export function EmptyNotice({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn("well flex flex-col items-center px-6 py-16 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-lime-ink nm-raised-sm" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h10l4 4v12H5zM15 4v4h4M9 13h6M9 17h4" />
        </svg>
      </span>
      <p className="mt-4 font-display text-lg font-bold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink/60">{description}</p>}
    </div>
  );
}
