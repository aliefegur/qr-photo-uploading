"use client";

import {useRequireAuth} from "@/hooks/useRequireAuth";
import {useCallback, useEffect, useMemo, useState} from "react";
import {GalleryEntry} from "@/types/gallery";
import {list, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {isProbablyVideo} from "@/utils/files";
import {resolveThumbURL} from "@/utils/thumbnail";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import MediaOverlay from "@/components/MediaOverlay";
import {faFolderOpen, faPhotoVideo} from "@fortawesome/free-solid-svg-icons";
import Spinner from "@/components/Spinner";

export default function GalleryPage() {
  // bu sayfanın sadece girişlilere açık olduğundan emin olalım
  const {user, loading} = useRequireAuth();
  const [items, setItems] = useState<GalleryEntry[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [overlayItem, setOverlayItem] = useState<GalleryEntry | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const canLoadMore = useMemo(() => pageToken !== null, [pageToken]);

  const loadPage = useCallback(async () => {
    if (loadingPage) return;
    setLoadingPage(true);
    try {
      const dirRef = ref(storage, "uploads");
      const res = await list(dirRef, {maxResults: 60, pageToken});
      // Sadece dosyaları al (prefixler klasör)
      const newEntries: GalleryEntry[] = res.items.map((r) => ({
        name: r.name,
        fullPath: r.fullPath,
        isVideo: isProbablyVideo(r.name),
      }));

      // Thumbnail URL'lerini paralel çek
      const thumbs = await Promise.all(
        newEntries.map((e) => resolveThumbURL(e.fullPath))
      );
      const withThumbs = newEntries.map((e, i) => ({...e, thumbURL: thumbs[i]}));

      setItems((prev) => [...prev, ...withThumbs]);
      setPageToken(res.nextPageToken ?? null); // null => daha yok
    } catch (e) {
      console.error("Listeleme hatası:", e);
      // hata olsa da tekrar denemeye izin ver
    } finally {
      setLoadingPage(false);
    }
  }, [pageToken, loadingPage]);

  useEffect(() => {
    if (loading) return;
    if (!user) return; // guard zaten /login'e atar
    // ilk sayfa
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const onItemClick = (item: GalleryEntry) => {
    setOverlayItem(item);
    setOverlayOpen(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50">
        <Spinner size={56} stroke={5}/>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="p-4 md:p-6 min-h-[100vh] flex flex-col">
      <h1 className="text-xl font-semibold mb-4">Galeri</h1>

      {/* EMPTY STATE vs GRID */}
      {!loadingPage && items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 flex-1">
          <FontAwesomeIcon icon={faFolderOpen} className="w-12 h-12 mb-3"/>
          <p className="text-sm">Henüz hiçbir içerik yüklenmedi</p>
        </div>
      ) : (
        <>
          {/* grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {items.map((it) => (
              <button
                key={it.fullPath}
                onClick={() => onItemClick(it)}
                className="group relative aspect-square rounded-xl overflow-hidden border bg-white"
                title={it.name}
              >
                {it.thumbURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.thumbURL}
                    alt={it.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : it.isVideo ? (
                  <div className="h-full w-full grid place-items-center bg-slate-100">
                    <FontAwesomeIcon icon={faPhotoVideo} className="h-7 w-7 text-slate-600"/>
                  </div>
                ) : (
                  <div className="h-full w-full grid place-items-center bg-slate-50">
                    <span className="text-[10px] text-slate-500">Önizleme yok</span>
                  </div>
                )}

                {it.isVideo && (
                  <span className="absolute left-2 top-2 text-[10px] px-1.5 py-0.5 rounded bg-black/65 text-white">
              Video
            </span>
                )}
              </button>
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center">
            {canLoadMore && (
              <button
                onClick={loadPage}
                disabled={loadingPage}
                className="mt-6 rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingPage ? "Yükleniyor…" : "Daha fazla yükle"}
              </button>
            )}
          </div>
        </>
      )}


      {/* Load more */}
      <div className="flex justify-center">
        {canLoadMore && (
          <button
            onClick={loadPage}
            disabled={loadingPage}
            className="mt-6 rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingPage ? "Yükleniyor…" : "Daha fazla yükle"}
          </button>
        )}
      </div>

      {/* overlay */}
      <MediaOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        item={overlayItem}
      />
    </main>
  );
}
