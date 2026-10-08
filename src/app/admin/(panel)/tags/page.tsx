import { PageHeader } from "@/components/admin/admin-shell";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Tags" };

export default function TagsPage() {
  return (
    <>
      <PageHeader title="Tags" description="Tags are created automatically when you add them to a post; manage them here." />
      <TaxonomyManager kind="tags" />
    </>
  );
}
