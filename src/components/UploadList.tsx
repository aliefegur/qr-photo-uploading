"use client";

import {UploadState} from "@/types/uploads";
import UploadItem from "./UploadItem";

export default function UploadList({
                                     uploads,
                                     onCancel,
                                     onDelete,
                                   }: {
  uploads: UploadState[];
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Yüklemeler</h2>
      <ul className="space-y-3">
        {uploads.map((u) => (
          <UploadItem key={u.id} u={u} onCancel={onCancel} onDelete={onDelete}/>
        ))}
      </ul>
    </div>
  );
}
