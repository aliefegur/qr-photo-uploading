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
  // tür tespiti
  const isVideo =
    (u.file?.type?.startsWith("video") ?? false) ||
    /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(u.fileName);

  // thumb varsa her zaman onu göster; yoksa (sadece image ise) local preview / downloadURL
  const hasThumb = Boolean(u.thumbURL);
  const imageSrc = hasThumb
    ? u.thumbURL
    : !isVideo
      ? (u.file ? u.previewURL : u.downloadURL)
      : undefined;

  console.log(imageSrc);

  return (
    <li className="flex items-center space-x-3 w-full p-2 bg-white rounded-lg shadow-sm">
      {/* PREVIEW */}
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={u.fileName}
          className="w-16 h-16 object-cover rounded"
          loading="lazy"
          width={64}
          height={64}
        />
      ) : isVideo ? (
        // video + thumb yok → ikon
        <div className="w-16 h-16 rounded bg-slate-200 grid place-items-center">
          <FontAwesomeIcon className="text-slate-600" icon={faPhotoVideo} style={{fontSize: "20pt"}}/>
        </div>
      ) : (
        // image fakat gösterilecek kaynak yok → ikon
        <div className="w-16 h-16 rounded bg-slate-100 grid place-items-center">
          <FontAwesomeIcon className="text-slate-500" icon={faImage} style={{fontSize: "20pt"}}/>
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
