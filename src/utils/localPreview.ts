"use client";

export type PreviewOk = { ok: true; dataUrl: string };
export type PreviewFail =
  | { ok: false; reason: "unsupported" }
  | { ok: false; reason: "error"; message?: string };
export type PreviewResult = PreviewOk | PreviewFail;

const MAX_DIM = 256;
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXT = /\.(heic|heif)$/i;

function isHeicFile(name: string, mime?: string): boolean {
  return HEIC_TYPES.has(mime ?? "") || HEIC_EXT.test(name);
}

function isImageLike(name: string, mime?: string): boolean {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i.test(name) || isHeicFile(name, mime);
}

function fitInside(w: number, h: number, max: number) {
  const s = Math.min(1, max / Math.max(w, h));
  return {dw: Math.max(1, Math.round(w * s)), dh: Math.max(1, Math.round(h * s))};
}

async function decodeToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = url;
  }).finally(() => {
    // decode tamamlandıktan sonra url'i temizliyoruz
    try {
      URL.revokeObjectURL(url);
    } catch {
    }
  });
}

export async function makeImagePreview(file: File, maxDim = MAX_DIM): Promise<PreviewResult> {
  // SSR güvenliği: her ihtimale karşı
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {ok: false, reason: "unsupported"};
  }

  try {
    const name = file.name;
    const mime = file.type;

    if (!isImageLike(name, mime)) return {ok: false, reason: "unsupported"};

    let source: Blob = file;

    // HEIC/HEIF → önce JPEG'e çevir (tarayıcıda ve sadece ihtiyaç olduğunda yükle)
    if (isHeicFile(name, mime)) {
      try {
        const mod = await import("heic2any");
        console.log('heic2any loaded!')
        const heic2any = mod.default as (opts: {
          blob: Blob;
          toType?: string;
          quality?: number
        }) => Promise<Blob | Blob[]>;

        const out = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.82,
        });

        source = Array.isArray(out) ? out[0] : out;
        console.log(source);
      } catch (e) {
        return {ok: false, reason: "error", message: e instanceof Error ? e.message : String(e)};
      }
    }

    const imgEl = await decodeToImage(source);
    const w = imgEl.naturalWidth || imgEl.width;
    const h = imgEl.naturalHeight || imgEl.height;
    const {dw, dh} = fitInside(w, h, maxDim);

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return {ok: false, reason: "error", message: "2D context unavailable"};

    ctx.drawImage(imgEl, 0, 0, dw, dh);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return {ok: true, dataUrl};
  } catch (e) {
    return {ok: false, reason: "error", message: e instanceof Error ? e.message : String(e)};
  }
}
