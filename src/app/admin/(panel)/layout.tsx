import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUserPage } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  return <AdminShell user={user}>{children}</AdminShell>;
}
