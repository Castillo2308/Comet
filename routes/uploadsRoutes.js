import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { uploadToDrive } from '../lib/drive.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  }
});

router.post('/photo', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const type = String(req.query.type || 'post');
    const folderId = type === 'report' ? process.env.DRIVE_REPORTS_FOLDER_ID : process.env.DRIVE_POSTS_FOLDER_ID;
    if (!folderId) {
      return res.status(500).json({ message: 'Google Drive folder ID not configured. Set DRIVE_POSTS_FOLDER_ID and DRIVE_REPORTS_FOLDER_ID in .env' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const result = await uploadToDrive(req.file.buffer, name, req.file.mimetype, folderId);
    res.status(201).json({ url: result.url, id: result.id, webViewLink: result.webViewLink, webContentLink: result.webContentLink });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ message: 'Failed to upload' });
  }
});

export default router;
