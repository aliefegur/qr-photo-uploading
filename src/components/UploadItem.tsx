"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faImage, faPhotoVideo, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import {UploadState} from "@/types/uploads";
import {formatBytes} from "@/utils/bytes";
import {getDownloadURL, getMetadata, ref} from "firebase/storage";
import {storage} from "@/lib/firebase";
import {FirebaseError} from "firebase/app"; // ✅ doğru paket

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

  const hasThumb = Boolean(u.thumbURL);
  const imageSrc = hasThumb ? u.thumbURL : !isVideo ? (u.file ? u.previewURL : u.downloadURL) : undefined;

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
          onError={async (e) => {
            if (u.path) {
              try {
                await getMetadata(ref(storage, u.path));               // obje var mı?
                const fresh = await getDownloadURL(ref(storage, u.path)); // token tazele
                onUpdateDownloadURL(u.id, fresh);                        // ✅ parent’ta state+LS güncelle
                e.currentTarget.src = fresh;                             // img tag’ini güncelle
                return;
              } catch (err: unknown) {
                if (err instanceof FirebaseError && err.code === "storage/object-not-found") {
                  onRemoveLocal(u.id);                                   // ✅ bulutta yok → local’den kaldır
                  return;
                }
                // başka bir hata ise dokunma (geçici olabilir)
              }
            } else {
              onRemoveLocal(u.id);                                       // path yoksa local’den kaldır
            }
          }}
        />
      ) : isVideo ? (
        <div className="w-16 h-16 rounded bg-slate-200 grid place-items-center">
          <FontAwesomeIcon className="text-slate-600" icon={faPhotoVideo} style={{fontSize: "20pt"}}/>
        </div>
      ) : (
        <div className="w-16 h-16 rounded bg-slate-100 grid place-items-center">
          <FontAwesomeIcon className="text-slate-500" icon={faImage} style={{fontSize: "20pt"}}/>
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
