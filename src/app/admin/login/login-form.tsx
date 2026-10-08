"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { api, ClientApiError, type FieldErrors } from "@/lib/client-api";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await api("/api/auth/login", { method: "POST", json: { email: form.get("email"), password: form.get("password") } });
      router.replace(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-5 p-6 sm:p-8" noValidate>
      {error && (
        <div role="alert" className="well flex items-center gap-2 px-4 py-3 text-sm font-medium text-danger">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-danger" />
          {error}
        </div>
      )}
      <Field label="Email" error={fieldErrors.email}>
        {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} name="email" type="email" autoComplete="username" required autoFocus />}
      </Field>
      <Field label="Password" error={fieldErrors.password}>
        {(id, d, invalid) => <Input id={id} aria-describedby={d} invalid={invalid} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <Button type="submit" variant="primary" loading={loading} className="!mt-8 h-12 w-full text-base">
        Sign in
      </Button>
    </form>
  );
}
