import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";

export const thumbCandidates = (fullPath: string) => {
  const fileName = fullPath.split("/").pop()!;        // "xxx.jpg" veya "xxx.mp4"
  const withoutExt = fileName.replace(/\.[^/.]+$/, ""); // "xxx"
  return [
    `thumbnails/thumb_${fileName}.jpg`,   // -> "thumb_xxx.jpg.jpg" / "thumb_xxx.mp4.jpg"
    `thumbnails/thumb_${withoutExt}.jpg`, // fallback
  ];
};

export async function resolveThumbURL(fullPath: string): Promise<string | null> {
  for (const cand of thumbCandidates(fullPath)) {
    try {
      const url = await getDownloadURL(ref(storage, cand));
      return url;
    } catch {
      // sıradaki adaya geç
    }
  }
  return null;
}