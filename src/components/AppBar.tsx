"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowUpFromBracket, faImages} from "@fortawesome/free-solid-svg-icons";
import {useRouter} from "next/navigation";

export default function AppBar({onPick}: { onPick: (files: FileList) => void }) {
  const router = useRouter();

  return (
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
          onChange={(e) => e.target.files && onPick(e.target.files)}
        />
        <div className="flex gap-2 items-center px-4 py-2">
          <span>Medya Yükle</span>
          <FontAwesomeIcon icon={faArrowUpFromBracket}/>
        </div>
      </label>
    </header>
  );
}
