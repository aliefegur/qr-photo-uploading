"use client";

import AppBar from "@/components/AppBar";
import UploadList from "@/components/UploadList";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import {useUploads} from "@/hooks/useUploads";

export default function Home() {
  const {uploads, addFiles, cancelUploadById, deleteCompletedById} = useUploads();

  return (
    <main className="relative h-screen flex flex-col">
      <AppBar onPick={(files) => addFiles(files)}/>

      <section className="flex-1 overflow-auto pt-20 pb-4 px-6 lg:px-20">
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
