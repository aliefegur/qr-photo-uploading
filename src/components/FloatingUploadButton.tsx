"use client";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowUpFromBracket} from "@fortawesome/free-solid-svg-icons";
import {track} from "@/lib/analytics";

export default function FloatingUploadButton({onPick}: { onPick: (files: FileList) => void }) {
  return (
    <label
      className="fixed right-8 bottom-8 w-14 h-14 rounded-full bg-blue-300 text-blue-900 border border-slate-400 shadow-lg flex items-center justify-center cursor-pointer z-50"
      onClick={() => track("button_click", {
        button_id: "floating_upload_button_upload_media",
        location: "floating_upload_button"
      })}>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        onChange={(e) => e.target.files && onPick(e.target.files)}
      />
      <FontAwesomeIcon icon={faArrowUpFromBracket} style={{height: 20, width: 20}}/>
    </label>
  );
}
