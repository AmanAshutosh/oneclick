export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="surface mb-14 h-56 animate-pulse" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface p-3">
            <div className="skeleton aspect-[16/10]" />
            <div className="px-3 pt-5 pb-3">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton mt-4 h-5 w-4/5" />
              <div className="skeleton mt-2 h-4 w-3/5" />
              <div className="skeleton mt-6 h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
