export type GalleryEntry = {
  name: string;
  fullPath: string;
  isVideo: boolean;
  thumbURL?: string;
};

export type Meta = {
  contentType: string | undefined;
  size: number | undefined;
  timeCreated: string | undefined;
  updated: string | undefined;
};
