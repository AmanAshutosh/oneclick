import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";

/** Detect image type from magic bytes — never trust the client's MIME type. SVG is rejected (XSS risk). */
function sniffImage(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return { mime: "image/gif", ext: "gif" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buf.subarray(4, 12).toString("ascii") === "ftypavif") return { mime: "image/avif", ext: "avif" };
  return null;
}

export function uploadRoot() {
  return path.resolve(process.cwd(), env.uploadDir);
}

export async function saveUpload(file: File, userId: string) {
  if (file.size === 0) throw new ApiError(422, `"${file.name}" is empty`);
  if (file.size > env.maxUploadBytes) {
    throw new ApiError(413, `"${file.name}" exceeds the ${Math.round(env.maxUploadBytes / 1024 / 1024)} MB limit`);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) throw new ApiError(415, `"${file.name}" is not a supported image (JPEG, PNG, GIF, WebP, AVIF)`);

  let width: number | null = null;
  let height: number | null = null;
  try {
    const dim = imageSize(buf);
    width = dim.width ?? null;
    height = dim.height ?? null;
  } catch {
    /* dimensions are optional */
  }

  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60);
  const rel = `${dir}/${base}-${randomBytes(6).toString("hex")}.${type.ext}`;
  const abs = path.join(uploadRoot(), rel);

  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);

  try {
    return await db.media.create({
      data: {
        filename: file.name.slice(0, 255),
        path: rel,
        url: `/uploads/${rel}`,
        mimeType: type.mime,
        size: file.size,
        width,
        height,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 300),
        uploadedById: userId,
      },
    });
  } catch (err) {
    await unlink(abs).catch(() => {});
    throw err;
  }
}

export async function listMedia(opts: { page: number; pageSize: number; q?: string }) {
  const where: Prisma.MediaWhereInput = opts.q ? { OR: [{ filename: { contains: opts.q, mode: "insensitive" } }, { alt: { contains: opts.q, mode: "insensitive" } }] } : {};
  const [total, items] = await db.$transaction([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { _count: { select: { posts: true } } },
    }),
  ]);
  return { items, total, page: opts.page, pageSize: opts.pageSize, totalPages: Math.max(1, Math.ceil(total / opts.pageSize)) };
}

export async function deleteMedia(id: string) {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) throw new ApiError(404, "Media not found");
  await db.media.delete({ where: { id } }); // posts' featuredImageId is set to null
  const abs = path.join(uploadRoot(), media.path);
  if (abs.startsWith(uploadRoot())) await unlink(abs).catch(() => {});
  return media;
}
