import Link from "next/link";
import { env } from "@/lib/env";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/feed.xml", label: "RSS", external: true },
  { href: "/admin", label: "Admin" },
];

export function SiteFooter() {
  return (
    <footer className="on-dark mt-28 px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-6xl rounded-nm-lg bg-ink px-6 py-10 text-cream/75 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2.5 font-display text-xl font-extrabold text-cream">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-base text-ink nm-dark-raised">
                O
              </span>
              {env.siteName}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed">{env.siteDescription}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-2">
              {LINKS.map((l) => {
                const cls = "inline-flex rounded-full bg-ink-raised px-4 py-2 text-sm font-semibold text-cream/80 nm-dark-raised transition hover:text-lime active:nm-dark-inset";
                return (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} className={cls}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={cls}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-ink-line pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {env.siteName}
          </p>
          <p>
            Made by <span className="font-semibold text-lime">Ashutosh</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
