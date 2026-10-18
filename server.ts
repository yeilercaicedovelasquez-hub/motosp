import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import * as repo from './src/db/repository.ts';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Support JSON payloads including base64 image uploads for attachments and before/after photos
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // ================= API ROUTES =================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dashboard Stats
  app.get('/api/dashboard', async (req, res) => {
    try {
      const stats = await repo.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener dashboard' });
    }
  });

  // Branches
  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await repo.getBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/branches', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const created = await repo.createBranch(req.body, userEmail);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/branches/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const updated = await repo.updateBranch(id, req.body, userEmail);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Vehicles
  app.get('/api/vehicles', async (req, res) => {
    try {
      const { search, status, branchId, vehicleType } = req.query;
      const list = await repo.getVehicles({
        search: search as string,
        status: status as string,
        branchId: branchId ? Number(branchId) : undefined,
        vehicleType: vehicleType as string,
      });
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/vehicles/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const vehicle = await repo.getVehicleById(id);
      if (!vehicle) return res.status(404).json({ error: 'Motocicleta no encontrada' });
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const created = await repo.createVehicle(req.body, userEmail);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const updated = await repo.updateVehicle(id, req.body, userEmail);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      await repo.deleteVehicle(id, userEmail);
      res.json({ success: true, message: 'Motocicleta eliminada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vehicle Maintenance Status & Alerts
  app.get('/api/vehicles/:id/alerts', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = await repo.getVehicleMaintenanceStatus(id);
      if (!status) return res.status(404).json({ error: 'Vehículo no encontrado' });
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Timeline Events (Hoja de Vida)
  app.get('/api/vehicles/:id/timeline', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const events = await repo.getTimelineEvents(id);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/vehicles/:id/timeline', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const eventData = {
        ...req.body,
        vehicleId: id,
      };
      const created = await repo.createTimelineEvent(eventData, userEmail);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Work Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const { status, vehicleId, priority } = req.query;
      const orders = await repo.getWorkOrders({
        status: status as string,
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        priority: priority as string,
      });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await repo.getWorkOrderById(id);
      if (!order) return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const order = await repo.createWorkOrder(req.body, userEmail);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/orders/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const updated = await repo.updateWorkOrder(id, req.body, userEmail);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Parts Inventory
  app.get('/api/inventory', async (req, res) => {
    try {
      const { search, category, lowStockOnly } = req.query;
      const parts = await repo.getPartsInventory({
        search: search as string,
        category: category as string,
        lowStockOnly: lowStockOnly === 'true',
      });
      res.json(parts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/inventory', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const part = await repo.createPart(req.body, userEmail);
      res.status(201).json(part);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/inventory/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const updated = await repo.updatePart(id, req.body, userEmail);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/inventory/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userEmail = req.user?.email || 'admin@motogestion.com';
      await repo.deletePart(id, userEmail);
      res.json({ success: true, message: 'Repuesto eliminado del inventario' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Maintenance Plans
  app.get('/api/plans', async (req, res) => {
    try {
      const plans = await repo.getMaintenancePlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/plans', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const plan = await repo.createMaintenancePlan(req.body, userEmail);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/plans/seed-defaults', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const plans = await repo.seedDefaultPlans(userEmail);
      res.status(201).json({ success: true, count: plans.length, plans });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workshop / Business Clean Reset
  app.post('/api/workshop/reset-blank', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { workshopName } = req.body;
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const result = await repo.resetAllDataToBlank(workshopName, userEmail);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Expenses
  app.get('/api/expenses', async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const expenses = await repo.getVehicleExpenses(vehicleId);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/expenses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const expense = await repo.createVehicleExpense(req.body, userEmail);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reports
  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await repo.getReportsData();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await repo.getAuditLogs(100);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Users & Auth Sync
  app.post('/api/auth/sync', async (req, res) => {
    try {
      const { uid, email, name, role } = req.body;
      if (!uid || !email) return res.status(400).json({ error: 'UID y Email son requeridos' });
      const user = await repo.getOrCreateUser(uid, email, name, role || 'supervisor');
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await repo.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/users/:id/role', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const { role } = req.body;
      const userEmail = req.user?.email || 'admin@motogestion.com';
      const updated = await repo.updateUserRole(id, role, userEmail);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ================= VITE MIDDLEWARE =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MotoGestión Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
