"use client";

import {useEffect, useRef, useState} from "react";
import type {UploadPatch, UploadState} from "@/types/uploads";
import {
  bindUploadEvents,
  cancelUpload as svcCancel,
  deleteByPath,
  startUpload,
  waitForThumbnailURL
} from "@/lib/uploadService";
import {loadUploads, saveUploads} from "@/utils/storage";
import {makeImagePreview} from "@/utils/localPreview";

export function useUploads() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const previewURLs = useRef<string[]>([]);

  // LS'den yükle
  useEffect(() => {
    const persisted = loadUploads();
    setUploads(persisted);
  }, []);

  // Sayfa açılınca, thumbURL'i olmayan completed kayıtlar için thumbnail'i dene
  useEffect(() => {
    const fillMissingThumbs = async () => {
      const needThumb = uploads.filter(u => u.complete && !u.thumbURL && u.path);
      if (needThumb.length === 0) return;

      const patched: UploadState[] = await Promise.all(
        needThumb.map(async (u) => {
          const thumbURL = await waitForThumbnailURL(u.path!);
          return thumbURL ? {...u, thumbURL} : u;
        })
      );

      if (patched.length > 0) {
        setUploads(prev => {
          const map = new Map(prev.map(x => [x.id, x]));
          patched.forEach(p => map.set(p.id, p));
          const arr = Array.from(map.values());
          saveUploads(arr);          // ✅ LS senkron
          return arr;
        });
      }
    };
    // sadece client'ta
    if (typeof window !== "undefined") {
      void fillMissingThumbs();
    }
  }, [uploads]);

  useEffect(() => {
    previewURLs.current = uploads.reduce<string[]>((acc, u) => {
      if (u.previewURL) acc.push(u.previewURL);
      return acc;
    }, []);
    return () => {
      previewURLs.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploads]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files as ArrayLike<File>);
    const newOnes: UploadState[] = arr.map(startUpload);

    // ekranda hemen görünsün diye önce raw blob (startUpload'ta var) ile ekle
    setUploads((prev): UploadState[] => [...newOnes, ...prev]);

    newOnes.forEach(async (u) => {
      // sadece görüntü dosyalarında küçük preview dene
      if (u.file && u.file.type.startsWith("image/")) {
        try {
          const res = await makeImagePreview(u.file, 256);
          if (res.ok) {
            setUploads((prev): UploadState[] =>
              prev.map((x) => {
                if (x.id !== u.id) return x;
                // eski blob'u serbest bırak
                if (x.previewURL && x.previewURL.startsWith("blob:")) {
                  try {
                    URL.revokeObjectURL(x.previewURL);
                  } catch {
                  }
                }
                return {...x, previewURL: res.dataUrl}; // ✅ küçük dataURL
              })
            );
          } else if (res.reason === "unsupported") {
            // HEIC/HEIF: <img> zaten gösteremez; ikon fallback kullanacağız
            // burada state'e dokunmuyoruz; UI ikon gösterecek
          }
        } catch (e) {
          console.warn("Local preview üretilemedi:", e);
        }
      }

      // upload eventlerini bağla (değiştirme yok)
      bindUploadEvents(
        u,
        (partial: UploadPatch) => {
          setUploads((prev): UploadState[] =>
            prev.map((x) => (x.id === partial.id ? ({...x, ...partial} as UploadState) : x))
          );
        },
        (partial: UploadPatch) => {
          setUploads((prev): UploadState[] => {
            const updated = prev.map((x) =>
              x.id === partial.id ? ({...x, ...partial} as UploadState) : x
            );
            saveUploads(updated);
            return updated;
          });
        },
        (error: unknown) => {
          console.error("Yükleme hatası:", error);
          setUploads((prev): UploadState[] => prev.filter((x) => x.id !== u.id));
        }
      );
    });
  };

  const cancelUploadById = (id: string) => {
    setUploads((prev): UploadState[] => {
      const found = prev.find(x => x.id === id);
      if (found) svcCancel(found);
      return prev.filter(x => x.id !== id);
    });
  };

  const deleteCompletedById = async (id: string) => {
    const target = uploads.find(u => u.id === id);
    if (!target?.path) return;
    await deleteByPath(target.path);
    const updated = uploads.filter(u => u.id !== id);
    setUploads(updated);
    saveUploads(updated);
  };

  return {uploads, addFiles, cancelUploadById, deleteCompletedById};
}
