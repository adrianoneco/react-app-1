import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const DATA_DIR = "./data";
const AVATARS_DIR = path.join(DATA_DIR, "avatars");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP."));
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export async function processAndSaveAvatar(
  file: Express.Multer.File,
  userId: string
): Promise<string> {
  const userDir = path.join(AVATARS_DIR, userId.substring(0, 2));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const filename = `${userId}.webp`;
  const filepath = path.join(userDir, filename);

  await sharp(file.buffer)
    .resize(256, 256, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 85 })
    .toFile(filepath);

  return `/api/avatars/${userId.substring(0, 2)}/${filename}`;
}

export function deleteAvatarFile(avatarPath: string): void {
  if (!avatarPath || !avatarPath.startsWith("/api/avatars/")) {
    return;
  }

  const relativePath = avatarPath.replace("/api/avatars/", "");
  const filepath = path.join(AVATARS_DIR, relativePath);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

export function getAvatarPath(relativePath: string): string {
  return path.join(AVATARS_DIR, relativePath);
}

export { AVATARS_DIR };
