export interface UploadState {
  id: string;
  file?: File;
  fileName: string;
  progress: number;
  complete: boolean;
  downloadURL?: string;
  path?: string;
  previewURL?: string;
  thumbURL?: string;
  bytesTransferred?: number;
  totalBytes?: number;
  uploadTask?: import("firebase/storage").UploadTask;
  isHeic?: boolean;          // HEIC/HEIF mi?
  previewPending?: boolean;  // local preview üretiliyor mu?
}

export type UploadPatch = Partial<UploadState> & { id: string };
