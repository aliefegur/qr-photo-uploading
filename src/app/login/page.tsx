import {Suspense} from "react";
import LoginClient from "@/app/login/LoginClient";

export default function GalleryPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginClient/>
    </Suspense>
  );
}
