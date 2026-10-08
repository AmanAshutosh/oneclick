import { PageHeader } from "@/components/admin/admin-shell";
import { MediaLibrary } from "@/components/admin/media-library";

export const metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Media library" description="Upload and manage images. Click an image to edit its alt text, copy its URL or delete it." />
      <div className="surface p-4 sm:p-7">
        <MediaLibrary />
      </div>
    </>
  );
}
