"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPhotoFilm, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import {UploadState} from "@/types/uploads";
import {formatBytes} from "@/utils/bytes";
import {isProbablyVideo} from "@/utils/files";

export default function UploadItem({
                                     u,
                                     onCancel,
                                     onDelete,
                                   }: {
  u: UploadState;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const hasThumb = Boolean(u.thumbURL);
  const isImage = hasThumb || (u.file?.type?.startsWith("image") ?? false);
  const isVideo =
    (u.file?.type?.startsWith("video") ?? false) || isProbablyVideo(u.fileName);
  // gösterilecek görsel kaynağı: önce thumbURL, yoksa (video değilse) fallback
  const imgSrc =
    u.thumbURL ||
    (!isVideo ? (u.file ? u.previewURL : u.downloadURL) : undefined);

  return (
    <li className="flex items-center space-x-3 w-full p-2 bg-white rounded-lg shadow-sm">
      {/* PREVIEW */}
      {imgSrc ? (
        // thumbnail veya (image için) fallback görsel
        <img
          src={imgSrc}
          alt={u.fileName}
          className="w-16 h-16 object-cover rounded"
          loading="lazy"
          decoding="async"
          width={64}
          height={64}
        />
      ) : isVideo ? (
        // video + thumbnail yok → sadece ikon
        <div
          className="w-16 h-16 rounded bg-slate-200 grid place-items-center"
          aria-label="Video"
        >
          <FontAwesomeIcon className="text-slate-600" icon={faPhotoFilm} style={{fontSize: "24pt"}}/>
        </div>
      ) : (
        // bilinmeyen/önizlenemeyen tip (çok nadir)
        <div className="w-16 h-16 rounded bg-slate-100 grid place-items-center">
          <span className="text-[10px] text-slate-500">No preview</span>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium truncate break-words">{u.fileName}</p>

          <div className="flex items-center space-x-2">
            {!u.complete && (
              <button className="text-red-500 text-xs" onClick={() => onCancel(u.id)}>
                İptal
              </button>
            )}

            {u.complete && (
              <button
                className="text-red-600 cursor-pointer"
                onClick={() => onDelete(u.id)}
                title="Sil"
              >
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
                style={{width: `${u.progress}%`}}
              />
            </div>
            <p className="text-xs text-gray-600">
              {`${formatBytes(u.bytesTransferred || 0)} / ${formatBytes(u.totalBytes || 0)} (${Math.round(
                u.progress || 0
              )}% tamamlandı)`}
            </p>
          </>
        )}
      </div>
    </li>
  );
}
