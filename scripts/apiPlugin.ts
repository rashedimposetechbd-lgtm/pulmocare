import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

export function pulmoApiPlugin(): Plugin {
  const uploadsDir = path.resolve(process.cwd(), 'public/uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `img_${Date.now()}_${cleanName}`;
      cb(null, uniqueName);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  return {
    name: 'pulmo-api-plugin',
    configureServer(server) {
      // 1. Image Upload Endpoint
      server.middlewares.use('/api/upload', (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        upload.single('file')(req as any, res as any, (err: any) => {
          if (err) {
            console.error('[API Upload Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }

          const file = (req as any).file;
          if (!file) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'No file received' }));
            return;
          }

          const publicUrl = `/uploads/${file.filename}`;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            url: publicUrl,
            fileName: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            alt: file.originalname.replace(/\.[^/.]+$/, '')
          }));
        });
      });

      // 2. Media List Endpoint
      server.middlewares.use('/api/media', (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const files = fs.readdirSync(uploadsDir);
          const items = files
            .filter((f) => !f.startsWith('.'))
            .map((filename) => {
              const fullPath = path.join(uploadsDir, filename);
              const stat = fs.statSync(fullPath);
              return {
                id: `upload_${filename}`,
                url: `/uploads/${filename}`,
                storagePath: `uploads/${filename}`,
                fileName: filename,
                size: stat.size,
                uploadedAt: stat.mtimeMs,
                alt: filename.replace(/^img_\d+_/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
              };
            })
            .sort((a, b) => b.uploadedAt - a.uploadedAt);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, items }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // 3. MySQL Dump Download Endpoint
      server.middlewares.use('/api/export-sql', (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        const sqlPath = path.resolve(process.cwd(), 'database/pulmo_care_mysql.sql');
        if (fs.existsSync(sqlPath)) {
          const content = fs.readFileSync(sqlPath, 'utf-8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/sql');
          res.setHeader('Content-Disposition', 'attachment; filename="pulmo_care_mysql.sql"');
          res.end(content);
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('SQL export file not found');
        }
      });
    }
  };
}
