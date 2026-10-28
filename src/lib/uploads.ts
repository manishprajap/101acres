import path from "path";
import fs from "fs";

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || "/var/www/html/101acres/uploads";

export const UPLOAD_URL_PREFIX = "/api/uploads";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTOS = 50;

export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export function resolveUploadPath(filename: string): string | null {
  if (!filename) return null;

  const safeName = filename.replace(/\\/g, "/").split("/").pop();

  if (!safeName) return null;

  if (!/^[a-zA-Z0-9._-]+$/.test(safeName)) {
    return null;
  }

  const fullPath = path.join(UPLOAD_DIR, safeName);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fullPath;
}