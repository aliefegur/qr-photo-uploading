export const isProbablyVideo = (name?: string) => !!name && /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(name);
export const isHeicName = (name: string) => /\.(heic|heif)$/i.test(name);
