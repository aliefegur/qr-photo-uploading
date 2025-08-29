import {onObjectDeleted, onObjectFinalized} from "firebase-functions/v2/storage";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import exifr from "exifr";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

setGlobalOptions({region: "europe-west1", maxInstances: 10});

admin.initializeApp();

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const generateThumbnail = onObjectFinalized(async (event) => {
  const object = event.data;
  if (!object.name || !object.contentType) return;

  const filePath = object.name;
  const fileName = path.basename(filePath);
  if (filePath.startsWith("thumbnails/") || fileName.startsWith("thumb_")) return; // loop kır

  const bucket = admin.storage().bucket(object.bucket);
  const tmpSrc = path.join(os.tmpdir(), fileName);
  const thumbFileName = `thumb_${fileName}.jpg`;
  const tmpThumb = path.join(os.tmpdir(), thumbFileName);
  const destPath = `thumbnails/${thumbFileName}`;

  await bucket.file(filePath).download({destination: tmpSrc});

  try {
    if (object.contentType.startsWith("image/")) {
      // EXIF'e göre auto-orient; kareye sığdır (bozulma yok)
      await sharp(tmpSrc)
        .rotate()
        .resize(256, 256, {fit: "inside", withoutEnlargement: true, fastShrinkOnLoad: true})
        .withMetadata({orientation: 1})
        .jpeg({quality: 82})
        .toFile(tmpThumb);
    } else if (object.contentType.startsWith("video/")) {
      // Oranı koru; 256x256'e pad ederek kare thumbnail üret
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tmpSrc)
          .outputOptions([
            "-vframes 1",
            "-vf",
            "thumbnail,scale='if(gt(a,1),256,-1)':'if(gt(a,1),-1,256)',pad=256:256:(256-iw)/2:(256-ih)/2:black",
          ])
          .output(tmpThumb)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    } else {
      console.log("Desteklenmeyen tür, thumbnail atlandı:", object.contentType, filePath);
      return;
    }

    await bucket.upload(tmpThumb, {
      destination: destPath,
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=3600",
      },
    });
    console.log("Thumbnail yüklendi:", destPath);
  } catch (err) {
    console.error("Thumbnail oluşturma hatası:", err);
  } finally {
    try {
      fs.unlinkSync(tmpSrc);
    } catch {
    }
    try {
      fs.unlinkSync(tmpThumb);
    } catch {
    }
  }
});

/** ---------------------------------------
 *  2) KAYNAK SİLİNİNCE THUMBNAIL'I SİL
 *  --------------------------------------- */
export const deleteThumbnailOnSourceDelete = onObjectDeleted(async (event) => {
  const object = event.data;
  if (!object?.name) return;

  const originalPath = object.name;
  if (originalPath.startsWith("thumbnails/")) return;
  if (!originalPath.startsWith("uploads/")) return; // isteğe bağlı ama güvenli

  const bucket = admin.storage().bucket(object.bucket);
  const fileName = path.basename(originalPath);
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");

  const candidates = [
    `thumbnails/thumb_${fileName}.jpg`,   // ...jpg.jpg veya ...mp4.jpg olabilir
    `thumbnails/thumb_${withoutExt}.jpg`, // fallback
  ];

  for (const t of candidates) {
    try {
      const f = bucket.file(t);
      const [exists] = await f.exists();
      if (exists) {
        await f.delete();
        console.log("Thumbnail silindi:", t);
      }
    } catch (err) {
      console.warn("Thumbnail silme hatası:", t, err);
    }
  }
});

/** ---------------------------------------------------
 *  3) EXIF/FFPROBE METADATA → STORAGE custom metadata
 *     (Firestore YOK — sadece Other metadata)
 *  --------------------------------------------------- */
export const indexMediaMetadata = onObjectFinalized(async (event) => {
  const obj = event.data;
  if (!obj.name || !obj.contentType) return;
  if (obj.name.startsWith("thumbnails/")) return;

  const bucket = admin.storage().bucket(obj.bucket);
  const filePath = obj.name;
  const file = bucket.file(filePath);

  // Geçerli GCS metadata’yı al (token vs. kaybolmasın)
  const [curr] = await file.getMetadata().catch(() => [undefined as any]);
  const existingCustomMeta = (curr?.metadata ?? {}) as Record<string, string>;

  const tmp = path.join(os.tmpdir(), path.basename(filePath));
  await file.download({destination: tmp});

  const collected: Record<string, any> = {
    fullPath: filePath,
    contentType: obj.contentType,
    size: Number(obj.size ?? 0),
    uploadedAt: obj.timeCreated ?? new Date().toISOString(),
  };

  try {
    if (obj.contentType.startsWith("image/")) {
      const exif = await exifr.parse(tmp, {tiff: true, exif: true, gps: true, xmp: true});
      collected.capturedAt = exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString() : null;
      collected.cameraMake = exif?.Make ?? null;
      collected.cameraModel = exif?.Model ?? null;
      collected.lensModel = exif?.LensModel ?? null;
      collected.iso = exif?.ISO ?? null;
      collected.fNumber = exif?.FNumber ?? null;
      collected.exposureTime = exif?.ExposureTime ?? null;
      collected.focalLength = exif?.FocalLength ?? null;
      if (exif?.latitude != null && exif?.longitude != null && exif?.altitude != null) {
        collected.gps = {latitude: exif.latitude, longitude: exif.longitude, altitude: exif.altitude};
      }
    } else if (obj.contentType.startsWith("video/")) {
      const probe: any = await new Promise((resolve, reject) =>
        ffmpeg.ffprobe(tmp, (err, data) => (err ? reject(err) : resolve(data)))
      );
      const format = probe?.format ?? {};
      const tags = format?.tags ?? {};
      const creation =
        tags["com.apple.quicktime.creationdate"] ||
        tags["creation_time"] ||
        tags["date"] ||
        null;

      collected.capturedAt = creation ? new Date(creation).toISOString() : null;
      collected.durationSec = format.duration ?? null;

      const stream = (probe?.streams || []).find((s: any) => s.width && s.height);
      if (stream) {
        collected.width = stream.width;
        collected.height = stream.height;
      }
    }
  } catch (e) {
    console.warn("Metadata parse failed:", e);
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
    }
  }

  // custom metadata yalnızca string kabul eder → temizle & stringleştir
  const toWrite: Record<string, string> = {...existingCustomMeta};
  for (const [k, v] of Object.entries(collected)) {
    if (v == null) continue;
    toWrite[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  try {
    await file.setMetadata({metadata: toWrite});
    console.log("Custom metadata güncellendi:", filePath);
  } catch (e) {
    console.error("setMetadata hatası:", e);
  }
});
