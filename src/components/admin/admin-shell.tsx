"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/posts", label: "Posts", icon: "M4 5h16M4 10h16M4 15h10M4 20h7" },
  { href: "/admin/posts/new", label: "New post", icon: "M12 5v14M5 12h14" },
  { href: "/admin/media", label: "Media", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1.5 1.5 0 1 0 0-.01" },
  { href: "/admin/categories", label: "Categories", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/admin/tags", label: "Tags", icon: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/posts") return pathname.startsWith("/admin/posts") && pathname !== "/admin/posts/new";
  return pathname.startsWith(href);
}

export function AdminShell({ user, children }: { user: { name: string; email: string; role: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="on-dark flex h-full flex-col rounded-nm-lg bg-ink text-cream">
      <Link href="/admin" className="flex h-20 items-center gap-3 px-6 font-display text-xl font-extrabold tracking-tight text-cream">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lg text-ink nm-dark-raised">O</span>
        OneClick
      </Link>
      <p className="px-7 pb-2 text-[11px] font-bold tracking-[0.18em] text-cream/45 uppercase">Workspace</p>
      <nav aria-label="Admin" className="flex-1 space-y-1.5 overflow-y-auto px-4 py-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active ? "bg-lime text-ink nm-dark-raised" : "text-cream/70 hover:bg-ink-raised hover:text-cream hover:nm-dark-raised",
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-cream/70 transition hover:bg-ink-raised hover:text-lime hover:nm-dark-raised">
          View website <span aria-hidden>↗</span>
        </a>
        <div className="flex items-center gap-3 rounded-2xl bg-ink-raised p-3 nm-dark-inset">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink">{user.name.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-cream">{user.name}</p>
            <p className="truncate text-xs text-cream/55 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button onClick={logout} className="rounded-full px-3 py-1.5 text-xs font-semibold text-cream/70 transition hover:bg-ink hover:text-lime hover:nm-dark-raised active:nm-dark-inset">
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 p-4 lg:block">{sidebar}</aside>

        {/* Mobile drawer */}
        {open && <div className="fixed inset-0 z-40 bg-ink/45 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
        <aside
          className={cn("fixed inset-y-0 left-0 z-50 w-72 p-3 transition-transform duration-300 lg:hidden", open ? "translate-x-0" : "-translate-x-full")}
          aria-hidden={!open}
          inert={!open}
        >
          {sidebar}
        </aside>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 px-3 pt-3 lg:hidden">
            <div className="flex h-14 items-center gap-3 rounded-full bg-canvas pr-4 pl-2 nm-raised-sm">
              <button onClick={() => setOpen(true)} className="btn btn-secondary h-10 w-10" aria-label="Open navigation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <span className="flex items-center gap-2 font-display font-extrabold">
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-xs">O</span>
                OneClick Admin
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink/65">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
