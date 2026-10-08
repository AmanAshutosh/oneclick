import { PageHeader } from "@/components/admin/admin-shell";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" description="Group posts into sections. Categories appear in the website navigation." />
      <TaxonomyManager kind="categories" />
    </>
  );
}
