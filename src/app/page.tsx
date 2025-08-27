"use client";

import React, {useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faImages,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import {useRouter} from "next/navigation";
import {storage} from "@/lib/firebase";
import {ref, uploadBytesResumable, getDownloadURL} from "firebase/storage";
import {formatBytes} from "@/formatBytes";

interface UploadState {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  complete: boolean;
  downloadURL?: string;
  previewURL?: string;
  uploadTask?: ReturnType<typeof uploadBytesResumable>;
  bytesTransferred?: number; // yeni
  totalBytes?: number;       // yeni
}

export default function Home() {
  const router = useRouter();

  const [uploads, setUploads] = useState<UploadState[]>([]);

  const cancelUpload = (id: string) => {
    setUploads((prev) => {
      const upload = prev.find(u => u.id === id);
      if (upload?.uploadTask) {
        upload.uploadTask.cancel(); // yüklemeyi durdur
      }
      return prev.filter(u => u.id !== id); // listeden çıkar
    });
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const newUpload: UploadState = {
        id: `${Date.now()}-${file.name}`,
        file,
        fileName: file.name,
        progress: 0,
        complete: false,
        previewURL: URL.createObjectURL(file),
      };

      setUploads((prev) => [...prev, newUpload]);

      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      newUpload.uploadTask = uploadTask;

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploads((prev) =>
            prev.map((u) =>
              u.id === newUpload.id
                ? {
                  ...u,
                  progress,
                  bytesTransferred: snapshot.bytesTransferred,
                  totalBytes: snapshot.totalBytes,
                }
                : u
            )
          );
        },
        (error) => {
          if (error.code === "storage/canceled") {
            // TODO: Show toast
          } else {
            console.error("Yükleme hatası:", error);
          }
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === newUpload.id
                ? {...u, complete: true, progress: 100, downloadURL}
                : u
            )
          );
        }
      );
    });
  };

  return (
    <main className="relative h-screen flex flex-col">
      {/* App Bar */}
      <header
        className="fixed top-0 w-full flex justify-between items-center px-6 lg:px-16 h-16 border-b border-slate-300 bg-slate-100 z-50">
        <button
          className="flex items-center gap-2 text-blue-900 cursor-pointer"
          onClick={() => router.push("/gallery")}
        >
          <FontAwesomeIcon icon={faImages} className="w-5 h-5"/>
          <span>Galeriyi Görüntüle</span>
        </button>

        <label className="cursor-pointer relative text-blue-900">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            onChange={onFileChange}
          />
          <div className="flex gap-2 items-center px-4 py-2">
            <span>Medya Yükle</span>
            <FontAwesomeIcon icon={faArrowUpFromBracket}/>
          </div>
        </label>

      </header>

      {/* Content */}
      <section className="flex-1 overflow-auto pt-20 pb-4 px-6 lg:px-20">
        {uploads.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Yüklemeler</h2>
            <ul className="space-y-3">
              {uploads.map((upload) => (
                <li key={upload.id} className="flex items-center space-x-3 w-full">
                  {/* Preview */}
                  {upload.file.type.startsWith("image") ? (
                    <img src={upload.previewURL} className="w-16 h-16 object-cover rounded"/>
                  ) : (
                    <video src={upload.previewURL} className="w-16 h-16 object-cover rounded"/>
                  )}

                  {/* File info + progress */}
                  <div className="flex-1 flex flex-col space-y-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium truncate break-words">{upload.fileName}</p>

                      {upload.complete ? (
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-500"/>
                      ) : (
                        <button
                          className="text-red-500 text-xs ml-2 shrink-0"
                          onClick={() => cancelUpload(upload.id)}
                        >
                          İptal
                        </button>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden relative">
                      <div
                        className="h-2 rounded bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-300"
                        style={{width: `${upload.progress}%`}}
                      />
                    </div>

                    {/* Yükleme boyutu ve yüzdesi */}
                    {!upload.complete && upload.bytesTransferred !== undefined && upload.totalBytes !== undefined && (
                      <p className="text-xs text-gray-600">
                        {`${formatBytes(upload.bytesTransferred)} / ${formatBytes(upload.totalBytes)} (${Math.round(upload.progress)}% tamamlandı)`}
                      </p>
                    )}

                  </div>
                </li>


              ))}
            </ul>
          </div>
        ) : (
          <label className="flex-1 flex h-full items-center justify-center relative px-6 lg:px-20 cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              onChange={onFileChange}
            />
            <span>Medya yüklemek için ekrana dokunun.</span>
          </label>


        )}
      </section>

      {/* Floating Upload Button */}
      <label
        className="fixed right-8 bottom-8 w-14 h-14 rounded-full bg-blue-300 text-blue-900 border border-slate-400 shadow-lg flex items-center justify-center cursor-pointer z-50">
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          onChange={onFileChange}
        />
        <FontAwesomeIcon icon={faArrowUpFromBracket} style={{height: "20px", width: "20px"}}/>
      </label>
    </main>
  );
}
