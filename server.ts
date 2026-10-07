import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getBackendSupabaseClient, isSupabaseBackendConfigured, getSupabasePublicUrl } from './server/supabase.js';
import {
  fetchFullDatabase,
  fetchSettingsFromDb,
  upsertSettingsInDb,
  upsertTableInDb,
  deleteTableFromDb,
  updateTableStatusInDb,
  upsertMenuItemInDb,
  deleteMenuItemFromDb,
  upsertCategoryInDb,
  deleteCategoryFromDb,
  upsertInventoryInDb,
  adjustInventoryInDb,
  deleteInventoryFromDb,
  upsertOrderInDb,
  updateOrderStatusInDb,
  upsertOfferInDb,
  deleteOfferFromDb,
  upsertEmployeeInDb,
  deleteEmployeeFromDb,
  insertAuditLogInDb,
  upsertAuditLogsInDb,
  uploadMenuImageToStorage,
} from './server/supabase-queries.js';

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

// In-memory cache fallback for audit logs
let backendAuditLogs: any[] = [];

// ==========================================
// BACKEND API ROUTES
// ==========================================

// 1. Backend Status & Supabase Connection Check
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseBackendConfigured(),
    projectUrl: getSupabasePublicUrl(),
    storageBucket: 'menu-images',
  });
});

// 2. Initial Data Hydration: Pulls all tables from live Supabase DB
app.get('/api/database/init', async (_req: Request, res: Response) => {
  try {
    const result = await fetchFullDatabase();
    res.json({
      success: true,
      connected: result.connected,
      data: result.data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Storage Upload (Dish Image -> Supabase Storage 'menu-images' Bucket)
app.post('/api/storage/upload', async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, contentType = 'image/jpeg' } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }
    const result = await uploadMenuImageToStorage(fileName || `dish-${Date.now()}.jpg`, fileData, contentType);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for backwards compatibility
app.post('/api/supabase/storage/upload-menu-image', async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, contentType = 'image/jpeg' } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }
    const result = await uploadMenuImageToStorage(fileName || `dish-${Date.now()}.jpg`, fileData, contentType);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Settings API
app.get('/api/settings', async (_req: Request, res: Response) => {
  const settings = await fetchSettingsFromDb();
  res.json({ success: true, settings });
});

app.post('/api/settings', async (req: Request, res: Response) => {
  const settings = req.body;
  const result = await upsertSettingsInDb(settings);
  res.json(result);
});

// 5. Tables API
app.post('/api/tables', async (req: Request, res: Response) => {
  const table = req.body;
  const result = await upsertTableInDb(table);
  res.json(result);
});

app.delete('/api/tables/:id', async (req: Request, res: Response) => {
  const result = await deleteTableFromDb(req.params.id);
  res.json(result);
});

app.post('/api/tables/:tableNumber/status', async (req: Request, res: Response) => {
  const tableNumber = parseInt(req.params.tableNumber, 10);
  const { status, activeOrderId } = req.body;
  const result = await updateTableStatusInDb(tableNumber, status, activeOrderId);
  res.json(result);
});

// 6. Menu Items API
app.post('/api/menu-items', async (req: Request, res: Response) => {
  const item = req.body;
  const result = await upsertMenuItemInDb(item);
  res.json(result);
});

app.delete('/api/menu-items/:id', async (req: Request, res: Response) => {
  const result = await deleteMenuItemFromDb(req.params.id);
  res.json(result);
});

// 7. Categories API
app.post('/api/categories', async (req: Request, res: Response) => {
  const cat = req.body;
  const result = await upsertCategoryInDb(cat);
  res.json(result);
});

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  const result = await deleteCategoryFromDb(req.params.id);
  res.json(result);
});

// 7. Inventory API
app.post('/api/inventory', async (req: Request, res: Response) => {
  const item = req.body;
  const result = await upsertInventoryInDb(item);
  res.json(result);
});

app.post('/api/inventory/adjust', async (req: Request, res: Response) => {
  const { id, amount } = req.body;
  const result = await adjustInventoryInDb(id, amount);
  res.json(result);
});

app.delete('/api/inventory/:id', async (req: Request, res: Response) => {
  const result = await deleteInventoryFromDb(req.params.id);
  res.json(result);
});

// 8. Orders API
app.post('/api/orders', async (req: Request, res: Response) => {
  const order = req.body;
  const result = await upsertOrderInDb(order);
  res.json(result);
});

app.post('/api/orders/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  const result = await updateOrderStatusInDb(req.params.id, status);
  res.json(result);
});

// 9. Offers API
app.post('/api/offers', async (req: Request, res: Response) => {
  const offer = req.body;
  const result = await upsertOfferInDb(offer);
  res.json(result);
});

app.delete('/api/offers/:id', async (req: Request, res: Response) => {
  const result = await deleteOfferFromDb(req.params.id);
  res.json(result);
});

// 10. Employees API
app.post('/api/employees', async (req: Request, res: Response) => {
  const emp = req.body;
  const result = await upsertEmployeeInDb(emp);
  res.json(result);
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  const result = await deleteEmployeeFromDb(req.params.id);
  res.json(result);
});

// 11. Audit Logs API
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  const client = getBackendSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && data) {
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
    } catch {
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

  const result = await insertAuditLogInDb(log);
  res.json({ log, ...result });
});

// 12. Full Database Sync API
app.post('/api/database/sync', async (req: Request, res: Response) => {
  try {
    const { settings, tables, menuItems, categories, inventory, orders, offers, employees, auditLogs } = req.body;

    const promises: Promise<any>[] = [];

    if (settings) {
      promises.push(upsertSettingsInDb(settings));
    }

    if (Array.isArray(tables)) {
      for (const t of tables) promises.push(upsertTableInDb(t));
    }
    if (Array.isArray(menuItems)) {
      for (const m of menuItems) promises.push(upsertMenuItemInDb(m));
    }
    if (Array.isArray(categories)) {
      for (const c of categories) promises.push(upsertCategoryInDb(c));
    }
    if (Array.isArray(inventory)) {
      for (const i of inventory) promises.push(upsertInventoryInDb(i));
    }
    if (Array.isArray(orders)) {
      for (const o of orders) promises.push(upsertOrderInDb(o));
    }
    if (Array.isArray(offers)) {
      for (const off of offers) promises.push(upsertOfferInDb(off));
    }
    if (Array.isArray(employees)) {
      for (const emp of employees) promises.push(upsertEmployeeInDb(emp));
    }
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      promises.push(upsertAuditLogsInDb(auditLogs));
    }

    await Promise.allSettled(promises);

    res.json({ success: true, message: 'All entities synced to Supabase database successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
