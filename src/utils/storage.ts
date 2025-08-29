import {UploadState} from "@/types/uploads";

const LS_KEY = "uploads";

export const saveUploads = (uploads: UploadState[]) => {
  if (typeof window === "undefined") return;
  const completed = uploads
    .filter(u => u.complete)
    .map(u => ({
      id: u.id,
      fileName: u.fileName,
      downloadURL: u.downloadURL,
      path: u.path,
      thumbURL: u.thumbURL,   // ✅
      complete: true,
      progress: 100
    }));
  localStorage.setItem(LS_KEY, JSON.stringify(completed));
};

export const loadUploads = (): UploadState[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UploadState[];
  } catch {
    return [];
  }
};
