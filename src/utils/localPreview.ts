// utils/localPreview.ts
const HEIC_RE = /(image\/hei[cf])|(heic|heif)$/i;

export type PreviewResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "unsupported" | "decode_error" };

export async function makeImagePreview(
  file: File,
  maxSide = 256,
  outMime = "image/jpeg",
  quality = 0.82
): Promise<PreviewResult> {
  const maybeHeic = HEIC_RE.test(file.type) || HEIC_RE.test(file.name);

  // Kaynak blob: normalde file; HEIC’te JPEG’e dönüştürdüğümüz blob
  let srcBlob: Blob = file;

  if (maybeHeic) {
    try {
      const mod = await import("heic2any");
      const out = await mod.default({
        blob: file,
        toType: "image/jpeg",
        quality, // 0..1
      });
      srcBlob = (Array.isArray(out) ? out[0] : out) as Blob;
    } catch {
      // Dönüştürülemediyse tarayıcı zaten gösteremez
      return {ok: false, reason: "unsupported"};
    }
  }

  const scaleDims = (w: number, h: number) => {
    const s = Math.min(maxSide / w, maxSide / h, 1);
    return {w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s))};
  };

  // 1) createImageBitmap hızlı/sağlam
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(srcBlob);
      const {w, h} = scaleDims(bmp.width, bmp.height);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      (ctx as any).imageSmoothingQuality = "high";
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close?.();
      return {ok: true, dataUrl: canvas.toDataURL(outMime, quality)};
    } catch { /* düş */
    }
  }

  // 2) HTMLImage fallback
  try {
    const blobURL = URL.createObjectURL(srcBlob);
    const img = new Image();
    img.decoding = "async";
    img.src = blobURL;
    await (img.decode?.() ?? new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
    }));
    URL.revokeObjectURL(blobURL);

    const {w, h} = scaleDims(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    (ctx as any).imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    return {ok: true, dataUrl: canvas.toDataURL(outMime, quality)};
  } catch {
    return {ok: false, reason: "decode_error"};
  }
}
