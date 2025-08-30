declare module "heic-convert" {
  export default function heicConvert(opts: {
    buffer: Buffer | Uint8Array | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<Buffer | Uint8Array | ArrayBuffer>;
}
