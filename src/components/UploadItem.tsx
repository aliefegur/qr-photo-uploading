"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faImage, faPhotoVideo, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import {UploadState} from "@/types/uploads";
import {formatBytes} from "@/utils/bytes";
import {getDownloadURL, getMetadata, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {FirebaseError} from "firebase/app";
import Spinner from "@/components/Spinner"; // ✅ doğru paket

export default function UploadItem({
                                     u,
                                     onCancel,
                                     onDelete,
                                     onUpdateDownloadURL, // ✅ yeni
                                     onRemoveLocal,       // ✅ yeni
                                   }: {
  u: UploadState;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateDownloadURL: (id: string, freshURL: string) => void;
  onRemoveLocal: (id: string) => void;
}) {
  const isVideo =
    (u.file?.type?.startsWith("video") ?? false) ||
    /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(u.fileName);

  const showSpinner = Boolean(u.previewPending);
  const hasThumb = Boolean(u.thumbURL);
  const imageSrc =
    hasThumb
      ? u.thumbURL
      : !isVideo
        ? (u.file ? u.previewURL : u.downloadURL)
        : undefined;

  const transferred = u.bytesTransferred ?? 0;
  const total = (u.totalBytes ?? u.file?.size ?? 0);
  const pct = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : (u.progress ?? 0);

  return (
    <li className="flex items-center space-x-3 w-full p-2 bg-white rounded-lg shadow-sm">
      {/* PREVIEW */}
      {showSpinner ? (
        <div className="w-16 h-16 rounded bg-slate-100 grid place-items-center">
          <Spinner size={18}/>
        </div>
      ) : imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={u.fileName}
          className="w-16 h-16 object-cover rounded"
          width={64}
          height={64}
          onError={async (e) => {
            const src = e.currentTarget.src;

            // 1) Thumbnail 404 ise LS silme. Sadece ikona düş.
            if (/\/thumbnails\//.test(src)) {
              e.currentTarget.style.display = "none";
              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "grid";
              return;
            }

            // 2) Local blob/dataURL hatası (özellikle HEIC dönüşmeden önce): silme yok.
            if (src.startsWith("blob:") || src.startsWith("data:")) {
              e.currentTarget.style.display = "none";
              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "grid";
              return;
            }

            // 3) Cloud orijinal (uploads/...) kırıldıysa — gerçekten var mı kontrol et
            if (u.path) {
              try {
                await getMetadata(ref(storage, u.path));
                // Obje var → muhtemelen token eskidi; tazele
                const fresh = await getDownloadURL(ref(storage, u.path));
                e.currentTarget.src = fresh;
                return;
              } catch (err) {
                if (err instanceof FirebaseError && err.code === "storage/object-not-found") {
                  // Gerçekten yok: burada LS temizlenmesini istiyorsun → üstten gelen onDelete ile sil
                  onDelete(u.id);
                  return;
                }
              }
            }

            // Her durumda ikona düş
            e.currentTarget.style.display = "none";
            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = "grid";
          }}
        />
      ) : (
        <div className="w-16 h-16 rounded bg-slate-100 grid place-items-center">
          <FontAwesomeIcon className="text-slate-500" icon={isVideo ? faPhotoVideo : faImage}
                           style={{fontSize: "20pt"}}/>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium truncate break-words">{u.fileName}</p>

          <div className="flex items-center space-x-2">
            {!u.complete && (
              <button className="text-red-500 text-xs cursor-pointer" onClick={() => onCancel(u.id)}>
                İptal
              </button>
            )}

            {u.complete && (
              <button className="text-red-600 cursor-pointer" onClick={() => onDelete(u.id)} title="Sil">
                <FontAwesomeIcon icon={faTrashCan} style={{width: 20, height: 20}}/>
              </button>
            )}
          </div>
        </div>

        {u.file && !u.complete && (
          <>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden relative">
              <div
                className="h-2 rounded bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-300"
                style={{width: `${pct}%`}}
              />
            </div>
            <p className="text-xs text-gray-600">
              {`${formatBytes(transferred)} / ${formatBytes(total)} (${pct}% tamamlandı)`}
            </p>
          </>
        )}
      </div>
    </li>
  );
}
