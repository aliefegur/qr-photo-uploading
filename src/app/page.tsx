import {Metadata} from "next";
import MediaLoadingClient from "@/app/MediaLoadingClient";

export const metadata: Metadata = {
  title: "Medya Yükle - Oğuzhan ve Hatice",
}

export default function Home() {
  return <MediaLoadingClient/>
}
