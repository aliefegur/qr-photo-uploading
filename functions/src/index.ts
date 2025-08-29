import {onObjectFinalized} from "firebase-functions/v2/storage";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

// Fluent-ffmpeg için binary yolu
ffmpeg.setFfmpegPath(ffmpegPath.path);

export const generateThumbnail = onObjectFinalized({region: "europe-west1"}, async (event) => {
  const object = event.data;
  if (!object.name || !object.contentType) return;

  const bucket = admin.storage().bucket(object.bucket);
  const filePath = object.name;
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const thumbFileName = `thumb_${fileName}.jpg`;
  const thumbFilePath = path.join(os.tmpdir(), thumbFileName);
  const thumbDestination = `thumbnails/${thumbFileName}`;

  if (fileName.startsWith("thumb_")) return;

  await bucket.file(filePath).download({destination: tempFilePath});

  try {
    if (object.contentType.startsWith("image/")) {
      // Resim thumbnail
      await sharp(tempFilePath)
        .resize(256, 256, {fit: "inside"})
        .toFile(thumbFilePath);
      console.log("Resim thumbnail oluşturuldu:", thumbDestination);
    } else if (object.contentType.startsWith("video/")) {
      // Video thumbnail (fluent-ffmpeg ile)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath)
          .screenshots({
            timestamps: ["1"],
            filename: thumbFileName,
            folder: os.tmpdir(),
            size: "256x256"
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });
      console.log("Video thumbnail oluşturuldu:", thumbDestination);
    } else {
      console.log("Thumbnail oluşturulmadı, desteklenmeyen dosya:", fileName);
      return;
    }

    // Thumbnail'ı bucket'a yükle
    await bucket.upload(thumbFilePath, {
      destination: thumbDestination,
      metadata: {contentType: "image/jpeg"},
    });
  } catch (err) {
    console.error("Thumbnail oluşturulurken hata:", err);
  } finally {
    fs.unlinkSync(tempFilePath);
    if (fs.existsSync(thumbFilePath)) fs.unlinkSync(thumbFilePath);
  }
});
