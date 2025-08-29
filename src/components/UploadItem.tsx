"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faImage, faPhotoVideo, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import {UploadState} from "@/types/uploads";
import {formatBytes} from "@/utils/bytes";

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
  const isVideo =
    (u.file?.type?.startsWith("video") ?? false) || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(u.fileName);
  const imgSrc = u.thumbURL || (u.file ? u.previewURL : u.downloadURL);

  return (
    <li className="flex items-center space-x-3 w-full p-2 bg-white rounded-lg shadow-sm">
      {/* PREVIEW */}
      {imgSrc && !isVideo ? (
        <img
          src={imgSrc}
          alt={u.fileName}
          className="w-16 h-16 object-cover rounded"
          loading="lazy"
          width={64}
          height={64}
          onError={(e) => {
            // kırılırsa ikona düş
            const el = e.currentTarget;
            el.style.display = "none";
            const sib = el.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = "grid";
          }}
        />
      ) : null}

      {/* fallback kutu (başta gizli, img kırılırsa görünecek) */}
      {!isVideo ? (
        <div
          className="w-16 h-16 rounded bg-slate-100 grid place-items-center"
          style={{display: imgSrc && !isVideo ? "none" : "grid"}}
        >
          <FontAwesomeIcon className="w-6 h-6 text-slate-500" icon={faImage}/>
        </div>
      ) : (
        // video + thumb yok → ikon
        <div className="w-16 h-16 rounded bg-slate-200 grid place-items-center">
          <FontAwesomeIcon className="w-6 h-6 text-slate-600" icon={faPhotoVideo}/>
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
