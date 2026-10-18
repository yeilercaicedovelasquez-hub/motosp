import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq, desc, asc, ilike, and, or, sql } from 'drizzle-orm';

// Two-layer error wrapper for safe queries
async function runQuery<T>(action: () => Promise<T>, errorMessage: string): Promise<T> {
  try {
    return await action();
  } catch (error) {
    console.error(`DB Error (${errorMessage}):`, error);
    throw new Error(`${errorMessage}. Intente nuevamente más tarde.`, { cause: error });
  }
}

// =================== AUDIT LOGS ===================
export async function createAuditLog(data: {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  return runQuery(async () => {
    return await db.insert(schema.auditLogs).values({
      userId: data.userId || 'system',
      userName: data.userName || 'Sistema',
      action: data.action,
      entityType: data.entityType,
      entityId: String(data.entityId),
      details: data.details,
    }).returning();
  }, 'Error al registrar log de auditoría');
}

export async function getAuditLogs(limit = 50) {
  return runQuery(async () => {
    return await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);
  }, 'Error al obtener auditoría');
}

// =================== BRANCHES ===================
export async function getBranches() {
  return runQuery(async () => {
    return await db.select().from(schema.branches).orderBy(asc(schema.branches.name));
  }, 'Error al obtener sedes');
}

export async function createBranch(data: typeof schema.branches.$inferInsert, userEmail?: string) {
  return runQuery(async () => {
    const inserted = await db.insert(schema.branches).values(data).returning();
    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'branch',
      entityId: String(inserted[0].id),
      details: `Sede o taller creado: ${inserted[0].name}`,
    });
    return inserted[0];
  }, 'Error al crear sede');
}

export async function updateBranch(id: number, data: Partial<typeof schema.branches.$inferInsert>, userEmail?: string) {
  return runQuery(async () => {
    const updated = await db
      .update(schema.branches)
      .set(data)
      .where(eq(schema.branches.id, id))
      .returning();
    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'UPDATE',
      entityType: 'branch',
      entityId: String(id),
      details: `Sede o taller actualizada: ${updated[0].name}`,
    });
    return updated[0];
  }, `Error al actualizar sede ${id}`);
}


// =================== VEHICLES ===================
export async function getVehicles(filter?: {
  search?: string;
  status?: string;
  branchId?: number;
  vehicleType?: string;
}) {
  return runQuery(async () => {
    let query = db.select().from(schema.vehicles);
    const conditions = [];

    if (filter?.status && filter.status !== 'all') {
      conditions.push(eq(schema.vehicles.status, filter.status));
    }
    if (filter?.branchId && filter.branchId > 0) {
      conditions.push(eq(schema.vehicles.branchId, filter.branchId));
    }
    if (filter?.vehicleType && filter.vehicleType !== 'all') {
      conditions.push(eq(schema.vehicles.vehicleType, filter.vehicleType));
    }
    if (filter?.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.vehicles.plate, term),
          ilike(schema.vehicles.brand, term),
          ilike(schema.vehicles.model, term),
          ilike(schema.vehicles.ownerName, term),
          ilike(schema.vehicles.driverName, term),
          ilike(schema.vehicles.driverPhone, term),
          ilike(schema.vehicles.companyName, term)
        )
      );
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(schema.vehicles.plate));
  }, 'Error al obtener listado de motos');
}

export async function getVehicleById(id: number) {
  return runQuery(async () => {
    const results = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (results.length === 0) return null;
    const vehicle = results[0];

    // Get recent timeline events
    const timeline = await db
      .select()
      .from(schema.vehicleTimelineEvents)
      .where(eq(schema.vehicleTimelineEvents.vehicleId, id))
      .orderBy(desc(schema.vehicleTimelineEvents.eventDate), desc(schema.vehicleTimelineEvents.id));

    // Get work orders
    const orders = await db
      .select()
      .from(schema.workOrders)
      .where(eq(schema.workOrders.vehicleId, id))
      .orderBy(desc(schema.workOrders.scheduledDate));

    // Get expenses
    const expenses = await db
      .select()
      .from(schema.vehicleExpenses)
      .where(eq(schema.vehicleExpenses.vehicleId, id))
      .orderBy(desc(schema.vehicleExpenses.expenseDate));

    return {
      ...vehicle,
      timeline,
      orders,
      expenses,
    };
  }, `Error al obtener detalle de la moto con ID ${id}`);
}

export async function createVehicle(data: typeof schema.vehicles.$inferInsert, userEmail?: string) {
  return runQuery(async () => {
    const cleanPlate = (data.plate || '').toUpperCase().trim();
    if (!cleanPlate) {
      throw new Error('La placa de la motocicleta es obligatoria');
    }

    // Check if plate already registered
    const existing = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.plate, cleanPlate));

    if (existing.length > 0) {
      throw new Error(`La placa ${cleanPlate} ya se encuentra registrada en el taller.`);
    }

    const inserted = await db
      .insert(schema.vehicles)
      .values({
        ...data,
        plate: cleanPlate,
        brand: data.brand?.trim() || 'Desconocida',
        model: data.model?.trim() || 'Estándar',
        year: Number(data.year) || new Date().getFullYear(),
        displacementCc: data.displacementCc ? Number(data.displacementCc) : 150,
        currentMileage: Number(data.currentMileage) || 0,
        ownerName: data.ownerName?.trim() || 'Cliente Particular',
        driverPhone: data.driverPhone?.trim() || '',
        driverName: data.driverName?.trim() || '',
        companyName: data.companyName?.trim() || '',
        notes: data.notes?.trim() || '',
        status: data.status || 'active',
        vehicleType: data.vehicleType || 'motorcycle',
        branchId: data.branchId ? Number(data.branchId) : 1,
        createdBy: userEmail || 'admin@motogestion.com',
        updatedAt: new Date(),
      })
      .returning();

    const newVehicle = inserted[0];

    // Record initial registration timeline event
    await db.insert(schema.vehicleTimelineEvents).values({
      vehicleId: newVehicle.id,
      eventType: 'other',
      title: 'Ingreso Inicial al Taller',
      description: `Ingreso de la motocicleta con placa ${newVehicle.plate} (${newVehicle.brand} ${newVehicle.model}) a nombre del cliente ${newVehicle.ownerName || 'Particular'}. Odómetro inicial: ${newVehicle.currentMileage} km.`,
      mileage: newVehicle.currentMileage,
      eventDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      costTotal: '0',
      performedBy: userEmail || 'Sistema Taller',
      category: 'general',
      attachmentsJson: '[]',
      createdBy: userEmail || 'Sistema Taller',
    });

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'vehicle',
      entityId: String(newVehicle.id),
      details: `Registro de moto placa ${newVehicle.plate} (${newVehicle.brand} ${newVehicle.model}) - Cliente: ${newVehicle.ownerName}`,
    });

    return newVehicle;
  }, 'Error al crear motocicleta');
}

export async function updateVehicle(id: number, data: Partial<typeof schema.vehicles.$inferInsert>, userEmail?: string) {
  return runQuery(async () => {
    // If mileage changed, check if we need an audit or mileage milestone
    const current = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (current.length === 0) throw new Error('Moto no encontrada');

    const updated = await db
      .update(schema.vehicles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.vehicles.id, id))
      .returning();

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'UPDATE',
      entityType: 'vehicle',
      entityId: String(id),
      details: `Actualización de datos moto placa ${updated[0].plate}`,
    });

    return updated[0];
  }, `Error al actualizar moto ${id}`);
}

export async function deleteVehicle(id: number, userEmail?: string) {
  return runQuery(async () => {
    const current = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (current.length === 0) return false;

    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'DELETE',
      entityType: 'vehicle',
      entityId: String(id),
      details: `Eliminación de moto placa ${current[0].plate}`,
    });

    return true;
  }, `Error al eliminar moto ${id}`);
}

// =================== TIMELINE EVENTS (HOJA DE VIDA) ===================
export async function getTimelineEvents(vehicleId: number) {
  return runQuery(async () => {
    return await db
      .select()
      .from(schema.vehicleTimelineEvents)
      .where(eq(schema.vehicleTimelineEvents.vehicleId, vehicleId))
      .orderBy(desc(schema.vehicleTimelineEvents.eventDate), desc(schema.vehicleTimelineEvents.id));
  }, `Error al obtener hoja de vida de la moto ${vehicleId}`);
}

export async function createTimelineEvent(
  data: typeof schema.vehicleTimelineEvents.$inferInsert,
  userEmail?: string
) {
  return runQuery(async () => {
    const inserted = await db
      .insert(schema.vehicleTimelineEvents)
      .values({
        ...data,
        createdBy: userEmail || 'admin@motogestion.com',
      })
      .returning();

    // If the event has a higher mileage than vehicle's current mileage, auto-update vehicle odometer
    const vehicle = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, data.vehicleId));
    if (vehicle.length > 0 && data.mileage > vehicle[0].currentMileage) {
      await db
        .update(schema.vehicles)
        .set({ currentMileage: data.mileage, updatedAt: new Date() })
        .where(eq(schema.vehicles.id, data.vehicleId));
    }

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'timeline_event',
      entityId: String(inserted[0].id),
      details: `Nuevo evento en hoja de vida: ${data.title} (${data.eventType}) para moto #${data.vehicleId}`,
    });

    return inserted[0];
  }, 'Error al agregar evento a la hoja de vida');
}

// =================== WORK ORDERS ===================
export async function getWorkOrders(filter?: {
  status?: string;
  vehicleId?: number;
  priority?: string;
}) {
  return runQuery(async () => {
    let query = db
      .select({
        order: schema.workOrders,
        vehiclePlate: schema.vehicles.plate,
        vehicleBrand: schema.vehicles.brand,
        vehicleModel: schema.vehicles.model,
      })
      .from(schema.workOrders)
      .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id));

    const conditions = [];
    if (filter?.status && filter.status !== 'all') {
      conditions.push(eq(schema.workOrders.status, filter.status));
    }
    if (filter?.priority && filter.priority !== 'all') {
      conditions.push(eq(schema.workOrders.priority, filter.priority));
    }
    if (filter?.vehicleId) {
      conditions.push(eq(schema.workOrders.vehicleId, filter.vehicleId));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(schema.workOrders.scheduledDate), desc(schema.workOrders.id));

    return rows.map((r) => ({
      ...r.order,
      vehicle: {
        plate: r.vehiclePlate,
        brand: r.vehicleBrand,
        model: r.vehicleModel,
      },
    }));
  }, 'Error al obtener órdenes de trabajo');
}

export async function getWorkOrderById(id: number) {
  return runQuery(async () => {
    const orders = await db
      .select({
        order: schema.workOrders,
        vehicle: schema.vehicles,
      })
      .from(schema.workOrders)
      .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
      .where(eq(schema.workOrders.id, id));

    if (orders.length === 0) return null;

    const partsUsed = await db
      .select({
        item: schema.workOrderParts,
        part: schema.partsInventory,
      })
      .from(schema.workOrderParts)
      .innerJoin(schema.partsInventory, eq(schema.workOrderParts.partId, schema.partsInventory.id))
      .where(eq(schema.workOrderParts.workOrderId, id));

    return {
      ...orders[0].order,
      vehicle: orders[0].vehicle,
      partsUsed: partsUsed.map((p) => ({
        ...p.item,
        partName: p.part.name,
        partCode: p.part.code,
        category: p.part.category,
      })),
    };
  }, `Error al obtener orden ${id}`);
}

export async function createWorkOrder(
  data: typeof schema.workOrders.$inferInsert & {
    parts?: Array<{ partId: number; quantity: number; unitCost: number }>;
  },
  userEmail?: string
) {
  return runQuery(async () => {
    // Generate order number if not provided
    const orderNumber =
      data.orderNumber || `OT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const inserted = await db
      .insert(schema.workOrders)
      .values({
        ...data,
        orderNumber,
        createdBy: userEmail || 'admin@motogestion.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const order = inserted[0];

    // If order sets status to in_progress or pending, update vehicle status to 'maintenance'
    if (order.status === 'in_progress' || order.status === 'pending') {
      await db
        .update(schema.vehicles)
        .set({ status: 'maintenance', updatedAt: new Date() })
        .where(eq(schema.vehicles.id, order.vehicleId));
    }

    // Insert parts and deduct inventory
    if (data.parts && data.parts.length > 0) {
      let partsTotal = 0;
      for (const item of data.parts) {
        const subtotal = item.quantity * item.unitCost;
        partsTotal += subtotal;

        await db.insert(schema.workOrderParts).values({
          workOrderId: order.id,
          partId: item.partId,
          quantity: item.quantity,
          unitCost: String(item.unitCost),
          subtotal: String(subtotal),
        });

        // Deduct from stock
        await db
          .update(schema.partsInventory)
          .set({
            stock: sql`GREATEST(0, ${schema.partsInventory.stock} - ${item.quantity})`,
            updatedAt: new Date(),
          })
          .where(eq(schema.partsInventory.id, item.partId));
      }

      // Update order parts cost and total
      const labor = Number(order.laborCost) || 0;
      await db
        .update(schema.workOrders)
        .set({
          partsCost: String(partsTotal),
          totalCost: String(labor + partsTotal),
        })
        .where(eq(schema.workOrders.id, order.id));
    }

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'work_order',
      entityId: String(order.id),
      details: `Creación de orden ${order.orderNumber} para moto #${order.vehicleId}`,
    });

    return await getWorkOrderById(order.id);
  }, 'Error al crear orden de trabajo');
}

export async function updateWorkOrder(
  id: number,
  data: Partial<typeof schema.workOrders.$inferInsert>,
  userEmail?: string
) {
  return runQuery(async () => {
    const updated = await db
      .update(schema.workOrders)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.workOrders.id, id))
      .returning();

    const order = updated[0];

    // If order completed, auto-create a timeline event on the motorcycle's Hoja de Vida
    if (data.status === 'completed') {
      // Re-enable vehicle status if all orders are completed
      await db
        .update(schema.vehicles)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(schema.vehicles.id, order.vehicleId));

      // Check if timeline event already exists for this order
      const existingEvents = await db
        .select()
        .from(schema.vehicleTimelineEvents)
        .where(
          and(
            eq(schema.vehicleTimelineEvents.vehicleId, order.vehicleId),
            eq(schema.vehicleTimelineEvents.workOrderId, order.id)
          )
        );

      if (existingEvents.length === 0) {
        await db.insert(schema.vehicleTimelineEvents).values({
          vehicleId: order.vehicleId,
          eventType: 'preventive',
          title: `Mantenimiento Ejecutado (${order.orderNumber})`,
          description: `${order.description}. ${order.resolutionNotes || ''}`,
          mileage: order.currentMileage,
          eventDate: order.executionDate || new Date().toISOString().split('T')[0],
          costTotal: order.totalCost,
          performedBy: order.technicianName || 'Técnico Responsable',
          category: 'general',
          attachmentsJson: order.photosAfterJson || '[]',
          workOrderId: order.id,
          createdBy: userEmail || 'Sistema',
        });
      }
    }

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'STATUS_CHANGE',
      entityType: 'work_order',
      entityId: String(id),
      details: `Orden ${order.orderNumber} actualizada a estado: ${order.status}`,
    });

    return await getWorkOrderById(id);
  }, `Error al actualizar orden de trabajo ${id}`);
}

// =================== PARTS INVENTORY ===================
export async function getPartsInventory(filter?: {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}) {
  return runQuery(async () => {
    let query = db.select().from(schema.partsInventory);
    const conditions = [];

    if (filter?.category && filter.category !== 'all') {
      conditions.push(eq(schema.partsInventory.category, filter.category));
    }
    if (filter?.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.partsInventory.name, term),
          ilike(schema.partsInventory.code, term),
          ilike(schema.partsInventory.supplier, term),
          ilike(schema.partsInventory.compatibleModels, term)
        )
      );
    }
    if (filter?.lowStockOnly) {
      conditions.push(sql`${schema.partsInventory.stock} <= ${schema.partsInventory.minStock}`);
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(schema.partsInventory.name));
  }, 'Error al obtener inventario de repuestos');
}

export async function createPart(data: typeof schema.partsInventory.$inferInsert, userEmail?: string) {
  return runQuery(async () => {
    const inserted = await db.insert(schema.partsInventory).values({
      ...data,
      code: data.code.toUpperCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'part',
      entityId: String(inserted[0].id),
      details: `Nuevo repuesto registrado: ${inserted[0].name} (${inserted[0].code})`,
    });

    return inserted[0];
  }, 'Error al crear repuesto');
}

export async function updatePart(id: number, data: Partial<typeof schema.partsInventory.$inferInsert>, userEmail?: string) {
  return runQuery(async () => {
    const updated = await db
      .update(schema.partsInventory)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.partsInventory.id, id))
      .returning();

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'STOCK_ADJUST',
      entityType: 'part',
      entityId: String(id),
      details: `Actualización de repuesto ${updated[0].code}: Stock actual ${updated[0].stock}`,
    });

    return updated[0];
  }, `Error al actualizar repuesto ${id}`);
}

export async function deletePart(id: number, userEmail?: string) {
  return runQuery(async () => {
    const current = await db.select().from(schema.partsInventory).where(eq(schema.partsInventory.id, id));
    if (current.length === 0) return false;

    await db.delete(schema.partsInventory).where(eq(schema.partsInventory.id, id));

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'DELETE',
      entityType: 'part',
      entityId: String(id),
      details: `Eliminación de repuesto: ${current[0].name} (${current[0].code})`,
    });

    return true;
  }, `Error al eliminar repuesto ${id}`);
}

// =================== MAINTENANCE PLANS & ALERTS ===================
export async function getMaintenancePlans() {
  return runQuery(async () => {
    return await db
      .select()
      .from(schema.maintenancePlans)
      .where(eq(schema.maintenancePlans.isActive, true))
      .orderBy(asc(schema.maintenancePlans.intervalKm));
  }, 'Error al obtener planes preventivos');
}

export async function createMaintenancePlan(data: typeof schema.maintenancePlans.$inferInsert, userEmail?: string) {
  return runQuery(async () => {
    const inserted = await db.insert(schema.maintenancePlans).values(data).returning();
    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'plan',
      entityId: String(inserted[0].id),
      details: `Plan preventivo creado: ${inserted[0].name}`,
    });
    return inserted[0];
  }, 'Error al crear plan de mantenimiento');
}

export async function seedDefaultPlans(userEmail?: string) {
  return runQuery(async () => {
    const defaultPlans = [
      {
        name: 'Cambio de Aceite de Motor y Filtro',
        description: 'Sustitución de lubricante de motor (10W40/20W50) y cambio de elemento filtrante.',
        category: 'oil',
        intervalKm: 3000,
        intervalMonths: 3,
        toleranceKm: 300,
        toleranceDays: 15,
        isActive: true,
      },
      {
        name: 'Mantenimiento de Frenos y Pastillas',
        description: 'Revisión de pastillas/bandas, limpieza de mordazas y purga de líquido DOT 4.',
        category: 'brakes',
        intervalKm: 6000,
        intervalMonths: 6,
        toleranceKm: 400,
        toleranceDays: 20,
        isActive: true,
      },
      {
        name: 'Inspección Filtro de Aire y Bujía',
        description: 'Limpieza o cambio de filtro de aire y calibración/reemplazo de bujía.',
        category: 'filters',
        intervalKm: 9000,
        intervalMonths: 9,
        toleranceKm: 500,
        toleranceDays: 30,
        isActive: true,
      },
      {
        name: 'Kit de Arrastre (Cadena, Corona y Piñón)',
        description: 'Ajuste, lubricación profunda o sustitución de cadena, piñón de ataque y catalina.',
        category: 'chain_kit',
        intervalKm: 15000,
        intervalMonths: 12,
        toleranceKm: 600,
        toleranceDays: 30,
        isActive: true,
      },
      {
        name: 'Inspección y Cambio de Neumáticos',
        description: 'Verificación de profundidad de labrado, desgaste irregular y presión de llantas.',
        category: 'tires',
        intervalKm: 18000,
        intervalMonths: 18,
        toleranceKm: 800,
        toleranceDays: 45,
        isActive: true,
      },
      {
        name: 'Revisión Técnico-Mecánica Obligatoria y Gases',
        description: 'Chequeo general de emisiones de gases contaminantes, luces y suspensión.',
        category: 'general_checkup',
        intervalKm: 0,
        intervalMonths: 12,
        toleranceKm: 0,
        toleranceDays: 15,
        isActive: true,
      },
    ];

    const insertedList = [];
    for (const plan of defaultPlans) {
      const res = await db.insert(schema.maintenancePlans).values(plan).returning();
      insertedList.push(res[0]);
    }

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'SEED_PLANS',
      entityType: 'plan',
      entityId: 'multiple',
      details: 'Carga de 6 planes preventivos sugeridos para taller de motos',
    });

    return insertedList;
  }, 'Error al sembrar planes preventivos por defecto');
}

export async function resetAllDataToBlank(workshopName?: string, userEmail?: string) {
  return runQuery(async () => {
    // Delete relational records in reverse dependency order
    await db.delete(schema.workOrderParts);
    await db.delete(schema.workOrders);
    await db.delete(schema.vehicleTimelineEvents);
    await db.delete(schema.vehicleExpenses);
    await db.delete(schema.vehicles);
    await db.delete(schema.partsInventory);
    await db.delete(schema.maintenancePlans);
    await db.delete(schema.auditLogs);
    await db.delete(schema.branches);

    // Insert clean primary branch
    const branch = await db.insert(schema.branches).values({
      name: workshopName?.trim() || 'Taller Principal',
      code: 'SEDE-01',
      type: 'workshop',
      address: '',
      phone: '',
    }).returning();

    await createAuditLog({
      userId: userEmail || 'system',
      userName: userEmail || 'Administrador',
      action: 'SYSTEM_RESET',
      entityType: 'system',
      entityId: 'all',
      details: 'Limpieza total de datos. Sistema en blanco listo para operación del negocio.',
    });

    return { success: true, branch: branch[0] };
  }, 'Error al reiniciar datos del sistema');
}


/**
 * Calculates preventive maintenance alerts for each vehicle based on mileage and timeline
 * Returns status: 'green' (al día), 'yellow' (próximo), 'orange' (programado / umbral), 'red' (vencido/crítico)
 */
export async function getVehicleMaintenanceStatus(vehicleId: number) {
  return runQuery(async () => {
    const vehicleRes = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
    if (vehicleRes.length === 0) return null;
    const vehicle = vehicleRes[0];

    const plans = await db.select().from(schema.maintenancePlans).where(eq(schema.maintenancePlans.isActive, true));
    const timeline = await db
      .select()
      .from(schema.vehicleTimelineEvents)
      .where(eq(schema.vehicleTimelineEvents.vehicleId, vehicleId))
      .orderBy(desc(schema.vehicleTimelineEvents.eventDate), desc(schema.vehicleTimelineEvents.mileage));

    const statusList = plans.map((plan) => {
      // Find the last event matching this category
      const lastEvent = timeline.find(
        (t) =>
          t.category === plan.category ||
          t.title.toLowerCase().includes(plan.name.toLowerCase().slice(0, 8))
      );

      const lastKm = lastEvent ? lastEvent.mileage : 0;
      const kmSince = vehicle.currentMileage - lastKm;
      const intervalKm = plan.intervalKm || 0;
      const toleranceKm = plan.toleranceKm || 300;

      let urgency: 'green' | 'yellow' | 'orange' | 'red' = 'green';
      let remainingKm: number | null = null;
      let message = 'Al día';

      if (intervalKm > 0) {
        remainingKm = intervalKm - kmSince;
        if (remainingKm < 0) {
          urgency = 'red';
          message = `Vencido por ${Math.abs(remainingKm)} km`;
        } else if (remainingKm <= toleranceKm) {
          urgency = 'orange';
          message = `Crítico: faltan solo ${remainingKm} km`;
        } else if (remainingKm <= toleranceKm * 2) {
          urgency = 'yellow';
          message = `Próximo: faltan ${remainingKm} km`;
        } else {
          urgency = 'green';
          message = `Vigente (faltan ${remainingKm} km)`;
        }
      }

      return {
        planId: plan.id,
        planName: plan.name,
        category: plan.category,
        intervalKm,
        intervalMonths: plan.intervalMonths,
        lastKm,
        lastDate: lastEvent ? lastEvent.eventDate : null,
        kmSince,
        remainingKm,
        urgency,
        message,
      };
    });

    return {
      vehicle,
      plans: statusList,
      highestUrgency: statusList.some((s) => s.urgency === 'red')
        ? 'red'
        : statusList.some((s) => s.urgency === 'orange')
        ? 'orange'
        : statusList.some((s) => s.urgency === 'yellow')
        ? 'yellow'
        : 'green',
    };
  }, `Error al calcular alertas preventivas para moto ${vehicleId}`);
}

// =================== EXPENSES ===================
export async function getVehicleExpenses(vehicleId?: number) {
  return runQuery(async () => {
    let query = db
      .select({
        expense: schema.vehicleExpenses,
        plate: schema.vehicles.plate,
        brand: schema.vehicles.brand,
        model: schema.vehicles.model,
      })
      .from(schema.vehicleExpenses)
      .innerJoin(schema.vehicles, eq(schema.vehicleExpenses.vehicleId, schema.vehicles.id));

    if (vehicleId) {
      // @ts-ignore
      query = query.where(eq(schema.vehicleExpenses.vehicleId, vehicleId));
    }

    const rows = await query.orderBy(desc(schema.vehicleExpenses.expenseDate));
    return rows.map((r) => ({
      ...r.expense,
      vehicle: {
        plate: r.plate,
        brand: r.brand,
        model: r.model,
      },
    }));
  }, 'Error al obtener gastos');
}

export async function createVehicleExpense(
  data: typeof schema.vehicleExpenses.$inferInsert,
  userEmail?: string
) {
  return runQuery(async () => {
    const inserted = await db.insert(schema.vehicleExpenses).values({
      ...data,
      createdBy: userEmail || 'admin@motogestion.com',
    }).returning();

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'CREATE',
      entityType: 'expense',
      entityId: String(inserted[0].id),
      details: `Gasto registrado: $${data.amount} (${data.category}) para moto #${data.vehicleId}`,
    });

    return inserted[0];
  }, 'Error al registrar gasto');
}

// =================== DASHBOARD & ANALYTICS ===================
export async function getDashboardStats() {
  return runQuery(async () => {
    const allVehicles = await db.select().from(schema.vehicles);
    const activeVehicles = allVehicles.filter((v) => v.status === 'active').length;
    const maintenanceVehicles = allVehicles.filter((v) => v.status === 'maintenance').length;
    const inactiveVehicles = allVehicles.filter((v) => v.status === 'inactive' || v.status === 'retired').length;

    const allOrders = await db.select().from(schema.workOrders);
    const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
    const inProgressOrders = allOrders.filter((o) => o.status === 'in_progress').length;

    // Inventory low stock count
    const parts = await db.select().from(schema.partsInventory);
    const lowStockParts = parts.filter((p) => p.stock <= p.minStock).length;

    // Timeline costs (maintenance total)
    const timelineEvents = await db.select().from(schema.vehicleTimelineEvents);
    const totalMaintenanceCost = timelineEvents.reduce((acc, curr) => acc + (Number(curr.costTotal) || 0), 0);

    // Other expenses total
    const expenses = await db.select().from(schema.vehicleExpenses);
    const totalOtherExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const totalFleetCost = totalMaintenanceCost + totalOtherExpenses;

    // Quick vehicle alerts
    const alerts: Array<{
      vehicleId: number;
      plate: string;
      brand: string;
      model: string;
      title: string;
      urgency: 'yellow' | 'orange' | 'red';
      reason: string;
    }> = [];

    // Check status for each vehicle
    for (const v of allVehicles) {
      if (v.status === 'active') {
        const status = await getVehicleMaintenanceStatus(v.id);
        if (status && status.plans) {
          const criticalPlans = status.plans.filter((p) => p.urgency === 'red' || p.urgency === 'orange');
          for (const cp of criticalPlans) {
            alerts.push({
              vehicleId: v.id,
              plate: v.plate,
              brand: v.brand,
              model: v.model,
              title: cp.planName,
              urgency: cp.urgency as 'orange' | 'red',
              reason: cp.message,
            });
          }
        }
      }
    }

    return {
      totalVehicles: allVehicles.length,
      activeVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      pendingOrders,
      inProgressOrders,
      lowStockParts,
      totalMaintenanceCost,
      totalOtherExpenses,
      totalFleetCost,
      alerts: alerts.slice(0, 8),
    };
  }, 'Error al calcular estadísticas de dashboard');
}

// =================== REPORTS & METRICS ===================
export async function getReportsData() {
  return runQuery(async () => {
    const vehicles = await db.select().from(schema.vehicles);
    const timeline = await db.select().from(schema.vehicleTimelineEvents);
    const expenses = await db.select().from(schema.vehicleExpenses);
    const orders = await db.select().from(schema.workOrders);
    const partsUsed = await db
      .select({
        qty: schema.workOrderParts.quantity,
        subtotal: schema.workOrderParts.subtotal,
        partName: schema.partsInventory.name,
        category: schema.partsInventory.category,
      })
      .from(schema.workOrderParts)
      .innerJoin(schema.partsInventory, eq(schema.workOrderParts.partId, schema.partsInventory.id));

    // Calculate cost per vehicle
    const vehicleCostReport = vehicles.map((v) => {
      const vTimeline = timeline.filter((t) => t.vehicleId === v.id);
      const vExpenses = expenses.filter((e) => e.vehicleId === v.id);

      const maintenanceCost = vTimeline.reduce((sum, item) => sum + (Number(item.costTotal) || 0), 0);
      const otherExpensesCost = vExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const totalCost = maintenanceCost + otherExpensesCost;

      const costPerKm = v.currentMileage > 0 ? Number((totalCost / v.currentMileage).toFixed(2)) : 0;

      return {
        vehicleId: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        currentMileage: v.currentMileage,
        driverName: (v as any).ownerName || v.driverName || 'Cliente Particular',
        ownerName: (v as any).ownerName || v.driverName || 'Cliente Particular',
        maintenanceCost,
        otherExpensesCost,
        totalCost,
        costPerKm,
      };
    });

    // Parts consumption report
    const partStats: Record<string, { name: string; quantity: number; totalCost: number; category: string }> = {};
    for (const p of partsUsed) {
      if (!partStats[p.partName]) {
        partStats[p.partName] = {
          name: p.partName,
          quantity: 0,
          totalCost: 0,
          category: p.category,
        };
      }
      partStats[p.partName].quantity += p.qty;
      partStats[p.partName].totalCost += Number(p.subtotal) || 0;
    }

    const topParts = Object.values(partStats).sort((a, b) => b.quantity - a.quantity);

    // Expenses by category
    const categoryTotals: Record<string, number> = {
      preventive: 0,
      corrective: 0,
      parts: 0,
      fuel: 0,
      paperwork: 0,
      other: 0,
    };

    for (const t of timeline) {
      if (t.eventType === 'preventive') categoryTotals.preventive += Number(t.costTotal) || 0;
      else if (t.eventType === 'corrective' || t.eventType === 'repair') categoryTotals.corrective += Number(t.costTotal) || 0;
      else if (t.eventType === 'part_replacement') categoryTotals.parts += Number(t.costTotal) || 0;
      else if (t.eventType === 'insurance' || t.eventType === 'tax' || t.eventType === 'inspection') categoryTotals.paperwork += Number(t.costTotal) || 0;
      else categoryTotals.other += Number(t.costTotal) || 0;
    }

    for (const e of expenses) {
      if (e.category === 'fuel') categoryTotals.fuel += Number(e.amount) || 0;
      else categoryTotals.other += Number(e.amount) || 0;
    }

    return {
      vehicleCostReport,
      topParts,
      categoryTotals,
      totalOrdersCompleted: orders.filter((o) => o.status === 'completed').length,
    };
  }, 'Error al generar datos de reportes');
}

// =================== USER & RBAC ===================
export async function getOrCreateUser(uid: string, email: string, name?: string, role = 'supervisor') {
  return runQuery(async () => {
    const result = await db
      .insert(schema.users)
      .values({
        uid,
        email,
        fullName: name || email.split('@')[0],
        role,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.users.uid,
        set: {
          email,
          fullName: name || email.split('@')[0],
        },
      })
      .returning();

    return result[0];
  }, 'Error al sincronizar usuario');
}

export async function getAllUsers() {
  return runQuery(async () => {
    return await db.select().from(schema.users).orderBy(asc(schema.users.email));
  }, 'Error al listar usuarios');
}

export async function updateUserRole(userId: number, role: string, userEmail?: string) {
  return runQuery(async () => {
    const updated = await db
      .update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, userId))
      .returning();

    await createAuditLog({
      userId: userEmail,
      userName: userEmail,
      action: 'UPDATE',
      entityType: 'user',
      entityId: String(userId),
      details: `Rol de usuario ${updated[0].email} actualizado a ${role}`,
    });

    return updated[0];
  }, 'Error al cambiar rol');
}
