import {GalleryEntry} from "@/types/gallery";
import {useCallback, useState} from "react";

export default function useSelection(entries: GalleryEntry[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isSelected = useCallback((path: string) => selected.has(path), [selected]);
  const toggle = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);
  const selectAll = useCallback(() => setSelected(new Set(entries.map((e) => e.fullPath))), [entries]);

  return {selected, isSelected, toggle, clear, selectAll};
}
