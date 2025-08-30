// src/utils/mime.ts
export function inferMimeType(
  file: Pick<File, "name" | "type">
): string | undefined {
  if (file.type) return file.type; // tarayıcı verdiyse kullan
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "jpe":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "bmp":
      return "image/bmp";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "mp4":
      return "video/mp4";
    case "mov":
    case "qt":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    case "webm":
      return "video/webm";
    case "avi":
      return "video/x-msvideo";
    case "m4v":
      return "video/x-m4v";
    default:
      return undefined;
  }
}

export function isImageLikeByNameOrMime(
  name: string,
  mime?: string
): boolean {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?)$/i.test(name);
}

export function isVideoLikeByNameOrMime(
  name: string,
  mime?: string
): boolean {
  if (mime?.startsWith("video/")) return true;
  return /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(name);
}
