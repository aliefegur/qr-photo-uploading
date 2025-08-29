import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {GalleryEntry} from "@/types/gallery";
import {useEffect, useState} from "react";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {faDownload, faPhotoVideo, faXmark} from "@fortawesome/free-solid-svg-icons";
import Spinner from "@/components/Spinner";
import {isHeicName} from "@/utils/files";

export default function MediaOverlay({
                                       open,
                                       onClose,
                                       item,
                                     }: {
  open: boolean;
  onClose: () => void;
  item: GalleryEntry | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let revokeURL: string | null = null;

    const fetchUrl = async () => {
      if (!item) return;
      setLoading(true);
      setErr(null);
      setUrl(null);
      try {
        const orig = await getDownloadURL(ref(storage, item.fullPath));

        if (!item.isVideo && isHeicName(item.name)) {
          // HEIC -> JPEG dönüştür
          const resp = await fetch(orig);
          const heicBlob = await resp.blob();
          const mod = await import("heic2any");
          const out = await mod.default({blob: heicBlob, toType: "image/jpeg", quality: 0.9});
          const jpegBlob = (Array.isArray(out) ? out[0] : out) as Blob;
          const objectURL = URL.createObjectURL(jpegBlob);
          revokeURL = objectURL;
          if (active) setUrl(objectURL);
        } else {
          // JPEG/PNG/GIF ya da Video: direkt göster
          if (active) setUrl(orig);
        }
      } catch (e) {
        if (active) setErr("Medya yüklenemedi (yetki veya ağ hatası).");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (open && item) fetchUrl();
    return () => {
      active = false;
      if (revokeURL) URL.revokeObjectURL(revokeURL);
    };
  }, [open, item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow"
          aria-label="Kapat"
        >
          <FontAwesomeIcon icon={faXmark} className="h-5 w-5"/>
        </button>

        <div className="grid md:grid-cols-[1fr,280px] gap-0 md:gap-4 h-full">
          <div className="grid place-items-center bg-black">
            {loading && <Spinner variant="light" size={56} stroke={5} className="my-8"/>}

            {!loading && err && (
              <div className="text-white/90 p-6 text-center">{err}</div>
            )}

            {!loading && !err && url && (
              item.isVideo ? (
                <video
                  src={url}
                  poster={item.thumbURL || undefined}
                  controls
                  className="max-h-[85vh] w-full h-auto"
                />
              ) : (
                <img
                  src={url}
                  alt={item.name}
                  className="max-h-[85vh] w-auto h-auto object-contain"
                />
              )
            )}
          </div>

          <aside className="hidden md:flex flex-col p-4 gap-3">
            <h3 className="font-medium break-words">{item.name}</h3>
            {item.thumbURL ? (
              <img
                src={item.thumbURL}
                alt="Thumbnail"
                className="w-full aspect-square object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-slate-100 grid place-items-center border">
                {item.isVideo ? (
                  <FontAwesomeIcon icon={faPhotoVideo} className="w-8 h-8 text-slate-500"/>
                ) : (
                  <span className="text-xs text-slate-500">Önizleme yok</span>
                )}
              </div>
            )}

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 px-3 hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faDownload} className="h-4 w-4"/>
                İndir
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
