import {Suspense} from "react";
import LoginClient from "@/app/login/LoginClient";
import {Metadata} from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginClient/>
    </Suspense>
  );
}
