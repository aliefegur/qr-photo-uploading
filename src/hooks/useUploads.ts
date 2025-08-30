"use client";

import {useEffect, useRef, useState} from "react";
import type {UploadState} from "@/types/uploads";
import {
  bindUploadEvents,
  cancelUpload as svcCancel,
  deleteByPath,
  startUpload,
  waitForThumbnailURL
} from "@/lib/uploadService";
import {loadUploads, saveUploads} from "@/utils/storage";
import {makeImagePreview} from "@/utils/localPreview";
import {FirebaseError} from "@firebase/app";
import {getMetadata, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";

const HEIC_RE = /\.(heic|heif)$/i;

export function useUploads() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const previewURLs = useRef<string[]>([]);

  // LS'den yükle
  useEffect(() => {
    const saved = loadUploads();
    setUploads(saved);

    // Bulutta artık olmayanları LS'den temizle
    (async () => {
      const alive: UploadState[] = [];
      for (const u of saved) {
        // sadece tamamlanmış ve path'i olanları kontrol et
        if (!u.complete || !u.path) {
          alive.push(u);
          continue;
        }

        try {
          await getMetadata(ref(storage, u.path));
          // obje var → bırak
          alive.push(u);
        } catch (err: unknown) {
          // storage/object-not-found ise sil
          if (err instanceof FirebaseError && err.code === "storage/object-not-found") {
            // hiç ekleme yapma → düşer
            continue;
          }
          // başka hata (geçici ağ vb.) -> dokunma
          alive.push(u);
        }
      }

      if (alive.length !== saved.length) {
        setUploads(alive);
        saveUploads(alive);
      }
    })();
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

    // ekranda göster
    setUploads(prev => [...newOnes, ...prev]);

    newOnes.forEach((u) => {
      // A) Upload event’lerini HEMEN bağla (kaçırma)
      bindUploadEvents(
        u,
        (partial) => {
          setUploads(prev => prev.map(x => x.id === partial.id ? {...x, ...partial} : x));
        },
        (partial) => {
          setUploads(prev => {
            const next = prev.map(x => x.id === partial.id ? {...x, ...partial} : x);
            saveUploads(next);
            return next;
          });
        },
        (err) => {
          console.error("Yükleme hatası:", err);
          setUploads(prev => prev.filter(x => x.id !== u.id));
        }
      );

      // B) Preview’i ARKA PLANDA üret
      (async () => {
        const isHeic = HEIC_RE.test(u.fileName) || (u.file?.type?.startsWith("image/he") ?? false);
        // HEIC blob: preview <img>’de render edilemeyeceği için gizle + spinner
        if (isHeic) {
          setUploads(prev =>
            prev.map(x =>
              x.id === u.id ? {...x, isHeic: true, previewPending: true, previewURL: undefined} : x
            )
          );
        }

        if (u.file && (u.file.type.startsWith("image/") || isHeic)) {
          try {
            const res = await makeImagePreview(u.file, 256);
            setUploads(prev =>
              prev.map(x =>
                x.id === u.id
                  ? {
                    ...x,
                    previewURL: res.ok ? res.dataUrl : x.previewURL,
                    previewPending: false,
                  }
                  : x
              )
            );
          } catch {
            setUploads(prev => prev.map(x => x.id === u.id ? {...x, previewPending: false} : x));
          }
        }
      })();
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

  // mevcut saveUploadsToLocalStorage fonksiyonunu kullanıyoruz
  const removeUpload = (id: string) => {
    setUploads(prev => {
      const updated = prev.filter(u => u.id !== id);
      saveUploads(updated);
      return updated;
    });
  };

  const updateDownloadURLById = (id: string, freshURL: string) => {
    setUploads(prev => {
      const updated = prev.map(u => (u.id === id ? {...u, downloadURL: freshURL} : u));
      saveUploads(updated);
      return updated;
    });
  };

  return {
    uploads,
    addFiles,
    cancelUploadById,
    deleteCompletedById,
    removeUpload,
    updateDownloadURLById,
  };
}
