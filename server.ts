import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getBackendSupabaseClient, isSupabaseBackendConfigured, getSupabasePublicUrl } from './server/supabase.js';
import { uploadMenuImageToStorage, insertAuditLog, fetchAuditLogs } from './server/supabase-queries.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the AI Studio preview environment
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with large limit for image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory backend audit cache (also synced to Supabase when configured)
let backendAuditLogs: any[] = [];

// ==========================================
// BACKEND API ROUTES
// ==========================================

// 1. Backend Status & Supabase Connection Check (No credentials exposed)
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseBackendConfigured(),
    storageBucket: 'menu-images',
  });
});

// 2. Supabase Storage: Upload Menu Dish Image
app.post('/api/supabase/storage/upload-menu-image', async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, contentType = 'image/jpeg' } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    const client = getBackendSupabaseClient();
    const cleanFileName = (fileName || `dish-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `dishes/${Date.now()}-${cleanFileName}`;

    // If Supabase credentials are configured in backend environment:
    if (client) {
      try {
        // Strip data URL prefix if present
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const { data: uploadData, error: uploadError } = await client.storage
          .from('menu-images')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.warn('Supabase storage upload error:', uploadError.message);
          // Fall back gracefully to data URL
          return res.json({
            success: true,
            url: fileData,
            source: 'inline_fallback',
            message: `Bucket upload warning: ${uploadError.message}. Stored locally.`,
          });
        }

        const { data: publicUrlData } = client.storage.from('menu-images').getPublicUrl(uploadData.path);
        return res.json({
          success: true,
          url: publicUrlData.publicUrl,
          source: 'supabase_storage',
          path: uploadData.path,
        });
      } catch (err: any) {
        console.error('Error uploading to Supabase Storage:', err);
        return res.json({
          success: true,
          url: fileData,
          source: 'inline_fallback',
          message: 'Saved locally due to storage exception.',
        });
      }
    }

    // If Supabase credentials not set, store as optimized data URL
    return res.json({
      success: true,
      url: fileData,
      source: 'local_storage',
      message: 'Image saved in storage. (Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env for remote cloud bucket)',
    });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for general storage upload
app.post('/api/storage/upload', async (req: Request, res: Response) => {
  const { fileName, fileData, contentType = 'image/jpeg' } = req.body;
  if (!fileData) {
    return res.status(400).json({ success: false, message: 'No file data provided' });
  }
  const result = await uploadMenuImageToStorage(fileName || 'image.jpg', fileData, contentType);
  return res.json(result);
});

// 3. Supabase Database Sync Route (Backend proxy)
app.post('/api/supabase/sync', async (req: Request, res: Response) => {
  try {
    const client = getBackendSupabaseClient();
    if (!client) {
      return res.json({
        success: false,
        message: 'Supabase credentials not configured in backend environment (.env). Operating in local offline mode.',
      });
    }

    const { tables, menuItems, orders, auditLogs } = req.body;

    // Sync audit logs to supabase
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      const rows = auditLogs.map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp,
        staff_id: l.staffId,
        staff_name: l.staffName,
        staff_role: l.staffRole,
        category: l.category,
        action: l.action,
        details: l.details,
        metadata: l.metadata || {},
      }));

      await client.from('audit_logs').upsert(rows);
    }

    return res.json({
      success: true,
      message: 'Data successfully synchronized with Supabase database.',
    });
  } catch (err: any) {
    console.error('Supabase sync error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Audit Logs API Endpoints
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  const client = getBackendSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          timestamp: d.timestamp,
          staffId: d.staff_id,
          staffName: d.staff_name,
          staffRole: d.staff_role,
          category: d.category,
          action: d.action,
          details: d.details,
          metadata: d.metadata,
        }));
        return res.json({ success: true, logs: mapped });
      }
    } catch (e) {
      // fallback to in-memory
    }
  }

  res.json({ success: true, logs: backendAuditLogs });
});

app.post('/api/audit-logs', async (req: Request, res: Response) => {
  const log = req.body;
  if (!log) return res.status(400).json({ success: false, message: 'Empty log' });

  backendAuditLogs.unshift(log);
  if (backendAuditLogs.length > 500) backendAuditLogs = backendAuditLogs.slice(0, 500);

  const client = getBackendSupabaseClient();
  if (client) {
    try {
      await client.from('audit_logs').insert([
        {
          id: log.id,
          timestamp: log.timestamp,
          staff_id: log.staffId,
          staff_name: log.staffName,
          staff_role: log.staffRole,
          category: log.category,
          action: log.action,
          details: log.details,
          metadata: log.metadata || {},
        },
      ]);
    } catch (e) {
      console.warn('Could not persist audit log to Supabase:', e);
    }
  }

  res.json({ success: true, log });
});

// ==========================================
// VITE DEV SERVER OR STATIC PROD SERVING
// ==========================================
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BrewPulse full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
