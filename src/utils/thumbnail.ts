import {getBytes, getDownloadURL, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";

const thumbCache = new Map<string, string>(); // fullPath -> URL/objectURL

export const thumbCandidates = (fullPath: string) => {
  const fileName = fullPath.split("/").pop()!;          // "xxx.mp4"
  const withoutExt = fileName.replace(/\.[^/.]+$/, ""); // "xxx"
  return [
    `thumbnails/thumb_${fileName}.jpg`,   // -> xxx.mp4.jpg
    `thumbnails/thumb_${withoutExt}.jpg`, // fallback
  ];
};

export async function resolveThumbURL(fullPath: string): Promise<string | null> {
  if (thumbCache.has(fullPath)) return thumbCache.get(fullPath)!;

  for (const cand of thumbCandidates(fullPath)) {
    const r = ref(storage, cand);
    try {
      const url = await getDownloadURL(r);
      thumbCache.set(fullPath, url);
      return url;
    } catch {
      // continue
    }
    try {
      const bytes = await getBytes(r);
      const blob = new Blob([bytes], {type: "image/jpeg"});
      const obj = URL.createObjectURL(blob);
      thumbCache.set(fullPath, obj);
      return obj;
    } catch {
      // continue
    }
  }
  return null;
}