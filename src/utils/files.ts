export const isProbablyVideo = (name?: string) => !!name && /\.(mp4|mov|mkv|webm|avi)$/i.test(name);
