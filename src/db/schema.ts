import { relations } from 'drizzle-orm';
import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table with Firebase Auth UID linkage
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').notNull().default('supervisor'), // admin, supervisor, technician, viewer
  phone: text('phone'),
  branchId: integer('branch_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Branches / Sedes / Operating entities
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  type: text('type').notNull().default('workshop'), // workshop, fleet, delivery, rental
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vehicles (Motorcycles and future vehicles)
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  plate: text('plate').notNull().unique(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  color: text('color'),
  engineNumber: text('engine_number'),
  vin: text('vin'),
  vehicleType: text('vehicle_type').notNull().default('motorcycle'), // motorcycle, scooter, motocarro, other
  displacementCc: integer('displacement_cc'),
  currentMileage: integer('current_mileage').notNull().default(0),
  purchaseDate: text('purchase_date'),
  status: text('status').notNull().default('active'), // active, maintenance, inactive, retired
  photoUrl: text('photo_url'),
  notes: text('notes'),
  branchId: integer('branch_id'),
  ownerName: text('owner_name'),
  driverName: text('driver_name'),
  driverPhone: text('driver_phone'),
  companyName: text('company_name'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Timeline Events (Hoja de Vida de la Moto)
export const vehicleTimelineEvents = pgTable('vehicle_timeline_events', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: text('event_type').notNull(), // preventive, corrective, repair, inspection, insurance, tax, accident, part_replacement, other
  title: text('title').notNull(),
  description: text('description'),
  mileage: integer('mileage').notNull(),
  eventDate: text('event_date').notNull(), // YYYY-MM-DD
  costTotal: numeric('cost_total', { precision: 10, scale: 2 }).default('0'),
  performedBy: text('performed_by'),
  category: text('category'), // oil, tires, brakes, battery, chain_kit, filters, spark_plugs, paperwork, general
  attachmentsJson: text('attachments_json').default('[]'),
  workOrderId: integer('work_order_id'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Work Orders (Órdenes de Trabajo)
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  vehicleId: integer('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, cancelled
  priority: text('priority').notNull().default('medium'), // low, medium, high, critical
  technicianName: text('technician_name'),
  description: text('description').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  executionDate: text('execution_date'),
  currentMileage: integer('current_mileage').notNull(),
  laborCost: numeric('labor_cost', { precision: 10, scale: 2 }).default('0'),
  partsCost: numeric('parts_cost', { precision: 10, scale: 2 }).default('0'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).default('0'),
  diagnosticNotes: text('diagnostic_notes'),
  resolutionNotes: text('resolution_notes'),
  photosBeforeJson: text('photos_before_json').default('[]'),
  photosAfterJson: text('photos_after_json').default('[]'),
  branchId: integer('branch_id'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Parts Inventory (Catálogo de Repuestos e Insumos)
export const partsInventory = pgTable('parts_inventory', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // oil_fluids, tires, brakes, electrical, transmission, filters, engine, accessories
  supplier: text('supplier'),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  unitMeasure: text('unit_measure').default('UN'),
  compatibleModels: text('compatible_models').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Parts used in Work Orders
export const workOrderParts = pgTable('work_order_parts', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  partId: integer('part_id')
    .references(() => partsInventory.id)
    .notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
});

// Preventive Maintenance Plans
export const maintenancePlans = pgTable('maintenance_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // oil, brakes, tires, chain_kit, filters, spark_plugs, general_checkup
  intervalKm: integer('interval_km').default(0),
  intervalMonths: integer('interval_months').default(0),
  toleranceKm: integer('tolerance_km').default(300),
  toleranceDays: integer('tolerance_days').default(15),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vehicle Expenses (Fuel, tolls, fines, etc.)
export const vehicleExpenses = pgTable('vehicle_expenses', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(), // fuel, toll, fine, wash, parking, other
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  mileage: integer('mileage'),
  expenseDate: text('expense_date').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs (Trazabilidad y control)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, STATUS_CHANGE, STOCK_ADJUST
  entityType: text('entity_type').notNull(), // vehicle, work_order, part, timeline_event, plan, user
  entityId: text('entity_id').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  timelineEvents: many(vehicleTimelineEvents),
  workOrders: many(workOrders),
  expenses: many(vehicleExpenses),
}));

export const vehicleTimelineEventsRelations = relations(vehicleTimelineEvents, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleTimelineEvents.vehicleId],
    references: [vehicles.id],
  }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [workOrders.vehicleId],
    references: [vehicles.id],
  }),
  partsUsed: many(workOrderParts),
}));

export const workOrderPartsRelations = relations(workOrderParts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderParts.workOrderId],
    references: [workOrders.id],
  }),
  part: one(partsInventory, {
    fields: [workOrderParts.partId],
    references: [partsInventory.id],
  }),
}));
