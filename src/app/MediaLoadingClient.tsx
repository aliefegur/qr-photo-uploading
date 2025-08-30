"use client";

import AppBar from "@/components/AppBar";
import UploadList from "@/components/UploadList";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import {useUploads} from "@/hooks/useUploads";
import Head from "next/head";

export default function MediaLoadingClient() {
  const {
    uploads,
    addFiles,
    cancelUploadById,
    deleteCompletedById,
    updateDownloadURLById,
    removeUpload,
  } = useUploads();

  return (
    <main className="relative min-h-screen flex flex-col mt-20">
      <Head>
        <title>Medya Yükle - Oğuzhan ve Hatice</title>
        <desc></desc>
      </Head>

      <AppBar onPick={(files) => addFiles(files)}/>

      <section className="flex-1 pb-4 px-6 lg:px-20">
        {uploads.length > 0 ? (
          <UploadList
            uploads={uploads}
            onCancel={cancelUploadById}
            onDelete={async (id) => {
              if (!confirm("Bu medyayı silmek istediğinizden emin misiniz?")) return;
              try {
                await deleteCompletedById(id);
              } catch (err) {
                console.error("Silme hatası:", err);
              }
            }}
            onUpdateDownloadURL={updateDownloadURLById} // ✅
            onRemoveLocal={removeUpload}               // ✅
          />
        ) : (
          <label className="flex-1 flex h-full items-center justify-center relative px-6 lg:px-20 cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <span>Medya yüklemek için ekrana dokunun.</span>
          </label>
        )}
      </section>

      <FloatingUploadButton onPick={(files) => addFiles(files)}/>
    </main>
  );
}
