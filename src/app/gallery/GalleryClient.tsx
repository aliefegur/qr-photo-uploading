"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {deleteObject, getDownloadURL, ref,} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {useRequireAuth} from "@/hooks/useRequireAuth";
import Spinner from "@/components/Spinner";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronLeft,
  faCloudDownloadAlt,
  faEllipsisVertical,
  faFileImage,
  faFolderOpen,
  faPhotoVideo,
  faSquareCheck,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {GalleryEntry} from "@/types/gallery";
import {useListUploads} from "@/hooks/useListUploads";
import MediaOverlay from "@/components/MediaOverlay";
import useSelection from "@/hooks/useSelection";

// ---------- Page (Drive-like UI) ----------
export default function GalleryPage() {
  const {user, loading} = useRequireAuth();
  const {items, setItems, canLoadMore, loadPage, loadingPage} = useListUploads();
  const {selected, isSelected, toggle, clear, selectAll} = useSelection(items);
  const [overlayItem, setOverlayItem] = useState<GalleryEntry | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (didInit.current) return;
    didInit.current = true;
    void loadPage();
  }, [loading, user, loadPage]);

  const selectionMode = selected.size > 0;

  const onOpen = (it: GalleryEntry) => {
    if (selectionMode) {
      toggle(it.fullPath);
      return;
    }
    setOverlayItem(it);
    setOverlayOpen(true);
  };

  const deleteSelected = useCallback(async () => {
    if (selected.size === 0) return;
    const ok = window.confirm(`${selected.size} öğe silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`);
    if (!ok) return;

    const paths = Array.from(selected);
    await Promise.allSettled(paths.map(async (p) => {
      try {
        await deleteObject(ref(storage, p));
      } catch { /* ignore */
      }
    }));

    setItems((prev) => prev.filter((e) => !selected.has(e.fullPath)));
    clear();
  }, [selected, clear, setItems]);

  const downloadSelected = useCallback(async () => {
    const paths = Array.from(selected);
    for (const p of paths) {
      try {
        const u = await getDownloadURL(ref(storage, p));
        const a = document.createElement("a");
        a.href = u;
        a.download = p.split("/").pop() ?? "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        await new Promise((res) => setTimeout(res, 300)); // küçük bir gecikme
      } catch {
        // geç
      }
    }
  }, [selected]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50">
        <Spinner size={56} stroke={5}/>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 h-14 border-b border-slate-300 bg-white/60 backdrop-blur flex items-center justify-between px-3 md:px-6">
        {!selectionMode ? (
          <div className="flex items-center gap-2 text-slate-800">
            <FontAwesomeIcon icon={faFolderOpen} className="h-5 w-5"/>
            <span className="font-medium">Galeri</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={clear} className="rounded border px-2 py-1 text-sm hover:bg-slate-50">
              <FontAwesomeIcon icon={faChevronLeft} className="mr-1"/>
              Seçimi temizle
            </button>
            <button onClick={selectAll} className="rounded border px-2 py-1 text-sm hover:bg-slate-50">
              <FontAwesomeIcon icon={faSquareCheck} className="mr-1"/>
              Tümünü seç
            </button>
          </div>
        )}

        {/* Right actions */}
        {selectionMode ? (
          <div className="flex items-center gap-2">
            <button onClick={downloadSelected} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
              <FontAwesomeIcon icon={faCloudDownloadAlt} className="mr-2"/>
              Seçilenleri indir
            </button>
            <button onClick={deleteSelected}
                    className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700">
              <FontAwesomeIcon icon={faTrash} className="mr-2"/>
              Seçilenleri sil
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <button className="rounded px-2 py-1 hover:bg-slate-50">
              <FontAwesomeIcon icon={faEllipsisVertical}/>
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="flex-1 p-3 md:p-6">
        {/* Empty state */}
        {!loadingPage && items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <FontAwesomeIcon icon={faFolderOpen} className="mb-3" style={{fontSize: "48pt"}}/>
            <p className="text-sm">Henüz hiçbir içerik yüklenmedi</p>
          </div>
        ) : (
          <>
            {/* Drive-like grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {items.map((it) => {
                const selectedNow = isSelected(it.fullPath);
                return (
                  <div key={it.fullPath}
                       className={`group relative aspect-square rounded-xl overflow-hidden ${selectedNow ? "ring-2 ring-blue-500 border-blue-500" : ""}`}>
                    {/* Thumb / Icon */}
                    {it.thumbURL ? (
                      <button onClick={() => onOpen(it)} className="absolute inset-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.thumbURL} alt={it.name}
                             className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                             loading="lazy" decoding="async"/>
                      </button>
                    ) : it.isVideo ? (
                      <button onClick={() => onOpen(it)}
                              className="absolute inset-0 grid place-items-center bg-slate-100">
                        <FontAwesomeIcon icon={faPhotoVideo} className="text-slate-600" style={{fontSize: "48pt"}}/>
                      </button>
                    ) : (
                      <button onClick={() => onOpen(it)}
                              className="absolute inset-0 grid place-items-center bg-slate-50">
                        <FontAwesomeIcon icon={faFileImage} className="text-slate-500" style={{fontSize: "48pt"}}/>
                      </button>
                    )}

                    {/* Filename footer */}
                    <div
                      className="flex items-center gap-2 px-2 py-3 absolute bottom-0 left-0 right-0 bg-white/50 backdrop-blur text-xs truncate">
                      <FontAwesomeIcon icon={faPhotoVideo} style={{fontSize: "16pt"}}/>
                      <p className="truncate">{it.name}</p>
                    </div>

                    {/* Checkbox (Drive-style): hover'da görün, selection'da kalıcı */}
                    <label
                      className={`absolute left-2 top-2 h-6 w-6 rounded bg-white shadow grid place-items-center cursor-pointer ${selectedNow ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={selectedNow}
                        onChange={() => toggle(it.fullPath)}
                      />
                      <span
                        className={`h-4 w-4 rounded ${selectedNow ? "border bg-blue-600 border-blue-600" : "bg-white"} grid place-items-center`}>
                        {selectedNow && <FontAwesomeIcon icon={faCheck} className="text-white h-3 w-3"/>}
                      </span>
                    </label>

                    {/* Video badge */}
                    {it.isVideo && (
                      <span
                        className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 rounded bg-black/65 text-white">Video</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            <div className="flex justify-center">
              {canLoadMore && (
                <button onClick={loadPage} disabled={loadingPage}
                        className="mt-6 rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-60">
                  {loadingPage ? "Yükleniyor…" : "Daha fazla yükle"}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Overlay */}
      <MediaOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} item={overlayItem}/>
    </main>
  );
}
