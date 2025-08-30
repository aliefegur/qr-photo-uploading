import {Suspense} from "react";
import GalleryClient from "./GalleryClient";
import {Metadata} from "next";

export const metadata: Metadata = {
  title: "Galeri",
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleryClient/>
    </Suspense>
  );
}
