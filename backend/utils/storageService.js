import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const ALLOWED_TYPES = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (jpg, png, gif, webp) and PDFs are allowed."
      ),
      false
    );
  }
};

// Multer upload middleware
const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Get the media type from a mimetype string
 */
const getMediaType = (mimetype) => {
  return ALLOWED_TYPES[mimetype] || null;
};

/**
 * Get the public URL for a stored file
 * In production, this would return an S3/Cloudinary URL
 */
const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

/**
 * Delete a file from storage
 * In production, this would delete from S3/Cloudinary
 */
const deleteFile = (filename) => {
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const storageService = {
  multerUpload,
  getMediaType,
  getFileUrl,
  deleteFile,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
};

export default storageService;
