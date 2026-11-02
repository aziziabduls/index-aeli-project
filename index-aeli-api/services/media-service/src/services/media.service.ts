import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface UploadMediaParams {
  file?: Express.Multer.File;
  owner_type?: string;
  owner_id?: string;
  caption?: string;
  order_index?: string;
  uploadsDir: string;
}

export class MediaService {
  async getMediaByOwner(owner_type?: string, owner_id?: string) {
    if (!owner_type || !owner_id) {
      throw new AppError('owner_type and owner_id are required', 400);
    }

    const { rows } = await pool.query(
      `SELECT * FROM media.media_assets
       WHERE owner_type = $1 AND owner_id = $2
       ORDER BY order_index ASC, created_at DESC;`,
      [owner_type, owner_id]
    );
    return rows;
  }

  async uploadMedia(params: UploadMediaParams) {
    const { file, owner_type, owner_id, caption, order_index, uploadsDir } = params;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!owner_type || !owner_id) {
      throw new AppError('owner_type and owner_id are required', 400);
    }

    const isVideo = file.mimetype.startsWith('video/');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    let filename = '';
    let fileType = 'photo';

    if (isVideo) {
      filename = uniqueSuffix + path.extname(file.originalname);
      fileType = 'video';
    } else {
      filename = `${uniqueSuffix}.avif`;
      fileType = 'photo';
    }

    const filePath = path.join(uploadsDir, filename);
    const fileUrl = `/uploads/${filename}`;

    try {
      if (isVideo) {
        fs.writeFileSync(filePath, file.buffer);
      } else {
        await sharp(file.buffer).toFormat('avif').toFile(filePath);
      }

      const { rows } = await pool.query(
        `INSERT INTO media.media_assets (owner_type, owner_id, url, type, caption, order_index)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
        [owner_type, owner_id, fileUrl, fileType, caption || '', parseInt(order_index || '0', 10)]
      );

      return rows[0];
    } catch (err: any) {
      // Clean up local file if write or DB insert fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw err;
    }
  }

  async deleteMedia(id: string, uploadsDir: string) {
    const { rows } = await pool.query('SELECT * FROM media.media_assets WHERE id = $1;', [id]);
    if (rows.length === 0) {
      throw new AppError('Media asset not found', 404);
    }

    const asset = rows[0];
    const fileName = path.basename(asset.url);
    const filePath = path.join(uploadsDir, fileName);

    await pool.query('DELETE FROM media.media_assets WHERE id = $1;', [id]);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return { message: 'Media asset deleted successfully' };
  }
}

export const mediaService = new MediaService();

