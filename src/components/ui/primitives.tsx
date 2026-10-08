"use client";

import { forwardRef, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/* Button ------------------------------------------------------------------ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, disabled, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("btn", size === "sm" ? "btn-sm" : "btn-md", `btn-${variant}`, className)}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className ?? "h-5 w-5")} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Centered loading indicator used inside cards and panels. */
export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-sm text-ink/60" role="status">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-lime-ink nm-raised-sm">
        <Spinner className="h-5 w-5" />
      </span>
      {label}
    </div>
  );
}

/** Inline error panel with a retry action. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center p-10 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-danger nm-inset-sm" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 8v5M12 16.5v.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <p className="mt-3 text-sm font-medium text-danger">{message}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/* Form fields ------------------------------------------------------------- */

export function Field({
  label,
  error,
  hint,
  children,
  counter,
}: {
  label: string;
  error?: string | string[];
  hint?: React.ReactNode;
  counter?: { value: number; max: number };
  children: (id: string, describedBy: string | undefined, invalid: boolean) => React.ReactNode;
}) {
  const id = useId();
  const err = Array.isArray(error) ? error[0] : error;
  const describedBy = err ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {counter && (
          <span className={cn("text-xs font-medium tabular-nums", counter.value > counter.max ? "text-danger" : "text-ink/50")}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children(id, describedBy, !!err)}
      {err ? (
        <p id={`${id}-err`} className="px-1 text-xs font-medium text-danger">
          {err}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="px-1 text-xs text-ink/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn("field", className)} {...props} />;
  },
);

export function Textarea({ className, invalid, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn("field resize-y", className)} {...props} />;
}

export function Select({ className, invalid, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select aria-invalid={invalid || undefined} className={cn("field", className)} {...props} />;
}

/* Badge ------------------------------------------------------------------- */

export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: string | Date | null }) {
  const scheduled = status === "PUBLISHED" && publishedAt && new Date(publishedAt) > new Date();
  const label = scheduled ? "Scheduled" : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        scheduled && "bg-ink text-cream",
        !scheduled && status === "PUBLISHED" && "bg-lime text-ink nm-raised-xs",
        status === "DRAFT" && "bg-canvas text-ink/75 nm-inset-sm",
        status === "ARCHIVED" && "bg-canvas-deep text-ink/60",
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", scheduled ? "bg-lime" : "bg-current")} />
      {label}
    </span>
  );
}

/* Modal (native <dialog> for focus trapping + Esc handling) --------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={cn(
        "m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-hidden rounded-nm-lg bg-canvas p-0 text-ink shadow-[0_30px_80px_-20px_rgb(0_29_33/0.45)] backdrop:bg-ink/45",
        size === "xl" ? "max-w-5xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[90dvh] animate-rise flex-col">
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
            <h2 id="modal-title" className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            <button onClick={onClose} className="btn btn-secondary h-9 w-9 shrink-0" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 bg-canvas-deep/50 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink/75">{message}</div>
    </Modal>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="well flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-lime-ink nm-raised-sm" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7l2-3h12l2 3M4 7v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M4 7h16M9 12h6" />
        </svg>
      </span>
      <p className="mt-4 font-display font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("surface", className)}>{children}</section>;
}
