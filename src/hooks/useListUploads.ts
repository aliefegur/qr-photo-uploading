import {useCallback, useMemo, useState} from "react";
import {GalleryEntry} from "@/types/gallery";
import {storage} from "@/lib/firebase";
import {list, ListResult, ref} from "firebase/storage";
import {isProbablyVideo} from "@/utils/files";
import {resolveThumbURL} from "@/utils/thumbnail";

export function useListUploads() {
  const [items, setItems] = useState<GalleryEntry[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);

  const canLoadMore = useMemo(() => pageToken !== null, [pageToken]);

  const loadPage = useCallback(async () => {
    if (loadingPage) return;
    setLoadingPage(true);
    try {
      const dirRef = ref(storage, "uploads");
      const res: ListResult = await list(dirRef, {maxResults: 60, pageToken: pageToken ?? undefined});

      const newEntries: GalleryEntry[] = res.items.map((r) => ({
        name: r.name,
        fullPath: r.fullPath,
        isVideo: isProbablyVideo(r.name),
      }));

      const thumbs = await Promise.all(newEntries.map((e) => resolveThumbURL(e.fullPath)));
      const withThumbs = newEntries.map((e, i) => ({...e, thumbURL: thumbs[i] ?? undefined}));

      setItems((prev) => [...prev, ...withThumbs]);
      setPageToken(res.nextPageToken ?? null);
    } finally {
      setLoadingPage(false);
    }
  }, [loadingPage, pageToken]);

  return {items, setItems, canLoadMore, loadPage, loadingPage};
}
