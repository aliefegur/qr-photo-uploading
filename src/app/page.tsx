"use client";

import React, {useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faImages,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import {useRouter} from "next/navigation";
import {storage} from "@/lib/firebase";
import {ref, uploadBytesResumable, getDownloadURL, deleteObject} from "firebase/storage";
import {formatBytes} from "@/formatBytes";

interface UploadState {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  complete: boolean;
  downloadURL?: string;
  path?: string;
  previewURL?: string;
  uploadTask?: ReturnType<typeof uploadBytesResumable>;
  bytesTransferred?: number; // yeni
  totalBytes?: number;       // yeni
}

export default function Home() {
  const router = useRouter();

  const [uploads, setUploads] = useState<UploadState[]>([]);

  const saveUploadsToLocalStorage = (uploads: UploadState[]) => {
    const completedUploads = uploads
      .filter(u => u.complete)
      .map(u => ({
        id: u.id,
        fileName: u.fileName,
        downloadURL: u.downloadURL,
        path: u.path,
        complete: true,
      }));
    localStorage.setItem("uploads", JSON.stringify(completedUploads));
  };

  const loadUploadsFromLocalStorage = (): UploadState[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("uploads");
    if (!data) return [];
    try {
      return JSON.parse(data) as UploadState[];
    } catch {
      return [];
    }
  };

  const cancelUpload = (id: string) => {
    setUploads((prev) => {
      const upload = prev.find(u => u.id === id);
      if (upload?.uploadTask) {
        upload.uploadTask.cancel(); // yüklemeyi durdur
      }
      return prev.filter(u => u.id !== id); // listeden çıkar
    });
  };

  const deleteFile = async (path: string) => {
    const fileRef = ref(storage, path);
    try {
      await deleteObject(fileRef);
      console.log("Dosya silindi:", path);
    } catch (error) {
      console.error("Dosya silme hatası:", error);
    }
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

      const path = `uploads/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
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
          setUploads(prev => {
            const updated = prev.map(u =>
              u.fileName === file.name
                ? {...u, complete: true, progress: 100, downloadURL, path}
                : u
            );
            saveUploadsToLocalStorage(updated); // burada güncel array’i kaydet
            return updated;
          });

        }
      );
    });
  };

  useEffect(() => {
    const savedUploads = loadUploadsFromLocalStorage();
    setUploads(savedUploads);
  }, []);

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
                <li key={upload.fileName}
                    className="flex items-center space-x-3 w-full p-2 bg-white rounded-lg shadow-sm">
                  {/* Preview */}
                  {upload.file ? (
                    upload.file.type.startsWith("image") ? (
                      <img
                        src={upload.previewURL}
                        className="w-16 h-16 object-cover rounded"
                        alt={upload.fileName}
                      />
                    ) : (
                      <video
                        src={upload.previewURL}
                        className="w-16 h-16 object-cover rounded"
                        controls
                      />
                    )
                  ) : (
                    // LocalStorage’dan yüklenenler için sadece image preview
                    <img
                      src={upload.downloadURL}
                      className="w-16 h-16 object-cover rounded"
                      alt={upload.fileName}
                    />
                  )}

                  {/* File info + progress */}
                  <div className="flex-1 flex flex-col space-y-1 min-w-0">
                    <div className="flex justify-between items-center">
                      {/* Dosya ismi */}
                      <p className="text-sm font-medium truncate break-words">{upload.fileName}</p>

                      <div className="flex items-center space-x-2">
                        {/* İptal butonu */}
                        {!upload.complete && (
                          <button
                            className="text-red-500 text-xs"
                            onClick={() => cancelUpload(upload.id)}
                          >
                            İptal
                          </button>
                        )}

                        {/* Silme butonu */}
                        {upload.complete && (
                          <button
                            className="text-red-600 cursor-pointer"
                            onClick={async () => {
                              if (!upload.path) return;
                              if (!confirm("Bu medyayı silmek istediğinizden emin misiniz?")) return;
                              try {
                                await deleteFile(upload.path);
                                const updated = uploads.filter(u => u.fileName !== upload.fileName);
                                setUploads(updated);
                                saveUploadsToLocalStorage(updated);
                              } catch (err) {
                                console.error("Silme hatası:", err);
                              }
                            }}
                          >
                            <FontAwesomeIcon icon={faTrashCan} style={{width: "20px", height: "20px"}}/>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {upload.file && !upload.complete && (
                      <>
                        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden relative">
                          <div
                            className="h-2 rounded bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-300"
                            style={{width: `${upload.progress}%`}}
                          />
                        </div>
                        <p className="text-xs text-gray-600">
                          {`${formatBytes(upload.bytesTransferred || 0)} / ${formatBytes(upload.totalBytes || 0)} (${Math.round(upload.progress)}% tamamlandı)`}
                        </p>
                      </>
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
