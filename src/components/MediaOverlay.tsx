import {useEffect, useRef, useState} from "react";
import {getDownloadURL, getMetadata, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {GalleryEntry, Meta} from "@/types/gallery";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCloudDownloadAlt, faXmark} from "@fortawesome/free-solid-svg-icons";
import Spinner from "@/components/Spinner";
import {formatBytes} from "@/utils/bytes";

export default function MediaOverlay({open, onClose, item}: {
  open: boolean;
  onClose: () => void;
  item: GalleryEntry | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const revokeRef = useRef<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!item || !open) return;
      setLoading(true);
      setUrl(null);
      setMeta(null);
      try {
        // Orijinal içerik URL'i
        const u = await getDownloadURL(ref(storage, item.fullPath));
        if (!active) return;
        setUrl(u);
        // Metadata
        const md = await getMetadata(ref(storage, item.fullPath));
        if (!active) return;
        setMeta({
          contentType: md.contentType,
          size: Number(md.size),
          timeCreated: md.timeCreated,
          updated: md.updated,
        });
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
      const toRevoke = revokeRef.current; // şu an kullanmıyoruz ama ileride objectURL'e dönersek
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    };
  }, [item, open]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-stretch md:items-center justify-center p-0 md:p-6"
      onClick={onClose}>
      <div
        className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-none md:rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-2">
          <button onClick={onClose} className="rounded-lg bg-white/90 px-2 py-1 shadow">
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5"/>
          </button>
        </header>

        <div className="grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-[1fr_340px] h-full">
          {/* META — mobile: üstte, desktop: sağda */}
          <aside
            className="order-1 md:order-none border-b md:border-b-0 md:border-l border-slate-200 p-4 flex flex-col gap-3">
            <h3 className="font-semibold break-words">{item.name}</h3>
            {meta ? (
              <ul className="text-sm text-slate-600 space-y-1">
                <li><span className="font-medium">Tür:</span> {meta.contentType ?? "—"}</li>
                <li><span className="font-medium">Boyut:</span> {meta.size != null ? formatBytes(meta.size) : "—"}</li>
                <li><span
                  className="font-medium">Oluşturma:</span> {meta.timeCreated ? new Date(meta.timeCreated).toLocaleString() : "—"}
                </li>
                <li><span
                  className="font-medium">Güncelleme:</span> {meta.updated ? new Date(meta.updated).toLocaleString() : "—"}
                </li>
              </ul>
            ) : (
              <div className="py-6"><Spinner size={28} stroke={4}/></div>
            )}

            {url && (
              <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 px-3 hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faCloudDownloadAlt} className="h-4 w-4"/>
                İndir
              </a>
            )}
          </aside>

          {/* CONTENT */}
          <div className="bg-black grid place-items-center p-2 md:p-4 order-2 md:order-none">
            {loading && <Spinner variant="light" size={56} stroke={5}/>}
            {!loading && url && (
              item.isVideo ? (
                <video src={url} poster={item.thumbURL || undefined} controls className="max-h-[80vh] w-full h-auto"/>
              ) : (
                <img src={url} alt={item.name} className="max-h-[80vh] w-auto h-auto object-contain"/>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}