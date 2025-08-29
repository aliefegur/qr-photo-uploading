import {storage} from "@/lib/firebase";
import {deleteObject, getDownloadURL, ref, uploadBytesResumable} from "firebase/storage";
import type {UploadState} from "@/types/uploads";

const getThumbnailCandidates = (originalPath: string) => {
  const base = originalPath.split("/").pop()!;               // "123-abc_IMG_4054.JPG"
  const withoutExt = base.replace(/\.[^/.]+$/, "");           // "123-abc_IMG_4054"
  return [
    `thumbnails/thumb_${base}.jpg`,       // ✅ thumb_...JPG.jpg  veya thumb_...MP4.jpg
    `thumbnails/thumb_${withoutExt}.jpg`, // fallback: thumb_...jpg
  ];
};

// 2) Her denemede tüm adayları sırayla dene (exponential backoff)
export const waitForThumbnailURL = async (
  originalPath: string,
  {tries = 6, baseDelayMs = 800} = {}
): Promise<string | undefined> => {
  const candidates = getThumbnailCandidates(originalPath);

  for (let i = 0; i < tries; i++) {
    for (const path of candidates) {
      try {
        const url = await getDownloadURL(ref(storage, path));
        return url; // bulundu
      } catch (_e) {
        // yoksa bir sonraki adaya geç
      }
    }
    await new Promise(res => setTimeout(res, baseDelayMs * Math.pow(1.6, i)));
  }
  return undefined; // hâlâ yoksa pes et
};

// (geri kalanlar aynı)
export const startUpload = (file: File): UploadState => {
  const id = `${Date.now()}-${(globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  const path = `uploads/${id}-${file.name}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return {
    id,
    file,
    fileName: file.name,
    progress: 0,
    complete: false,
    previewURL: URL.createObjectURL(file),
    path,
    uploadTask,
  };
};

export const bindUploadEvents = (
  u: UploadState,
  onProgress: (partial: { id: string } & Partial<UploadState>) => void,
  onComplete: (partial: { id: string } & Partial<UploadState>) => void,
  onError: (error: unknown) => void
) => {
  u.uploadTask?.on(
    "state_changed",
    (snapshot) => {
      onProgress({
        id: u.id,
        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes
      });
    },
    onError,
    async () => {
      if (!u.uploadTask || !u.path) return;
      const downloadURL = await getDownloadURL(u.uploadTask.snapshot.ref);

      // 🔎 thumbnail’ı iki isim varyantıyla ara
      const thumbURL = await waitForThumbnailURL(u.path);

      onComplete({
        id: u.id,
        complete: true,
        progress: 100,
        downloadURL,
        thumbURL,
      });
    }
  );
};

export const cancelUpload = (u: UploadState) => u.uploadTask?.cancel();
export const deleteByPath = async (path: string) => {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
};
