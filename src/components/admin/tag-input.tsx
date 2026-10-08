"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/** Chip-style tag input with autocomplete. New tags are created on save. */
export function TagInput({ value, onChange, suggestions, error }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; error?: string }) {
  const id = useId();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    const taken = new Set(value.map((v) => v.toLowerCase()));
    return suggestions.filter((s) => !taken.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q))).slice(0, 8);
  }, [text, value, suggestions]);

  function add(raw: string) {
    const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
    const next = [...value];
    for (const t of tags) if (!next.some((v) => v.toLowerCase() === t.toLowerCase()) && t.length <= 50) next.push(t);
    onChange(next.slice(0, 30));
    setText("");
    setHighlight(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (focused && matches[highlight] && text.trim() && matches[highlight].toLowerCase().startsWith(text.trim().toLowerCase())) add(matches[highlight]);
      else if (text.trim()) add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
  }

  const showList = focused && matches.length > 0;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block px-1 text-sm font-semibold text-ink">Tags</label>
      <div className={cn("relative rounded-2xl border bg-canvas px-2.5 py-2 nm-inset-sm transition focus-within:border-lime focus-within:ring-3 focus-within:ring-lime/35", error ? "border-danger/60" : "border-transparent")}>
        <ul className="flex flex-wrap gap-2">
          {value.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full bg-canvas py-1 pr-1 pl-3 text-sm font-medium nm-raised-xs">
              {t}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="flex h-5 w-5 items-center justify-center rounded-full text-ink/55 transition hover:bg-ink hover:text-cream" aria-label={`Remove tag ${t}`}>
                ×
              </button>
            </li>
          ))}
          <li className="min-w-24 flex-1">
            <input
              id={id}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                if (text.trim()) add(text);
              }}
              placeholder={value.length ? "" : "Add tags…"}
              className="w-full bg-transparent px-1 py-1 text-sm placeholder:text-ink/45 focus:outline-none"
              role="combobox"
              aria-expanded={showList}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
            />
          </li>
        </ul>
        {showList && (
          <ul id={`${id}-list`} role="listbox" className="absolute top-full right-0 left-0 z-20 mt-3 max-h-56 overflow-auto rounded-2xl bg-canvas p-1.5 nm-raised-sm">
            {matches.map((m, i) => (
              <li
                key={m}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(m);
                }}
                className={cn("cursor-pointer rounded-xl px-3 py-2 text-sm", i === highlight ? "bg-lime font-semibold text-ink" : "hover:bg-cream")}
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? <p className="px-1 text-xs font-medium text-danger">{error}</p> : <p className="px-1 text-xs text-ink/60">Press Enter or comma to add.</p>}
    </div>
  );
}
