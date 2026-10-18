export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  fullName?: string;
  role: UserRole;
  phone?: string;
  branchId?: number;
}

export interface Branch {
  id: number;
  name: string;
  code?: string;
  type: 'workshop' | 'fleet' | 'delivery' | 'rental';
  address?: string;
  phone?: string;
}

export type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'retired';
export type VehicleType = 'motorcycle' | 'scooter' | 'motocarro' | 'other';

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  engineNumber?: string;
  vin?: string;
  vehicleType: VehicleType;
  displacementCc?: number;
  currentMileage: number;
  purchaseDate?: string;
  status: VehicleStatus;
  photoUrl?: string;
  notes?: string;
  branchId?: number;
  ownerName?: string;
  driverName?: string;
  driverPhone?: string;
  companyName?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TimelineEventType =
  | 'preventive'
  | 'corrective'
  | 'repair'
  | 'inspection'
  | 'insurance'
  | 'tax'
  | 'accident'
  | 'part_replacement'
  | 'other';

export type EventCategory =
  | 'oil'
  | 'brakes'
  | 'tires'
  | 'battery'
  | 'chain_kit'
  | 'filters'
  | 'spark_plugs'
  | 'repair'
  | 'paperwork'
  | 'general';

export interface AttachmentFile {
  name: string;
  url: string;
  type: string;
  size?: string;
}

export interface VehicleTimelineEvent {
  id: number;
  vehicleId: number;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  mileage: number;
  eventDate: string;
  costTotal?: string | number;
  performedBy?: string;
  category?: EventCategory;
  attachmentsJson?: string;
  workOrderId?: number;
  createdBy?: string;
  createdAt?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type OrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkOrderPartItem {
  id?: number;
  workOrderId?: number;
  partId: number;
  partName?: string;
  partCode?: string;
  category?: string;
  quantity: number;
  unitCost: string | number;
  subtotal: string | number;
}

export interface WorkOrder {
  id: number;
  orderNumber: string;
  vehicleId: number;
  status: OrderStatus;
  priority: OrderPriority;
  technicianName?: string;
  description: string;
  scheduledDate: string;
  executionDate?: string;
  currentMileage: number;
  laborCost?: string | number;
  partsCost?: string | number;
  totalCost?: string | number;
  diagnosticNotes?: string;
  resolutionNotes?: string;
  photosBeforeJson?: string;
  photosAfterJson?: string;
  branchId?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
  };
  partsUsed?: WorkOrderPartItem[];
}

export interface PartInventory {
  id: number;
  code: string;
  name: string;
  category: string;
  supplier?: string;
  stock: number;
  minStock: number;
  unitCost: string | number;
  unitMeasure?: string;
  compatibleModels?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenancePlan {
  id: number;
  name: string;
  description?: string;
  category: EventCategory;
  intervalKm?: number;
  intervalMonths?: number;
  toleranceKm?: number;
  toleranceDays?: number;
  isActive?: boolean;
}

export interface MaintenanceStatusItem {
  planId: number;
  planName: string;
  category: EventCategory;
  intervalKm: number;
  intervalMonths: number;
  lastKm: number;
  lastDate: string | null;
  kmSince: number;
  remainingKm: number | null;
  urgency: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
}

export interface VehicleExpense {
  id: number;
  vehicleId: number;
  category: 'fuel' | 'toll' | 'fine' | 'wash' | 'parking' | 'other';
  amount: string | number;
  mileage?: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
  createdBy?: string;
  createdAt?: string;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
  };
}

export interface AuditLog {
  id: number;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;
  pendingOrders: number;
  inProgressOrders: number;
  lowStockParts: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  totalFleetCost: number;
  alerts: Array<{
    vehicleId: number;
    plate: string;
    brand: string;
    model: string;
    title: string;
    urgency: 'yellow' | 'orange' | 'red';
    reason: string;
  }>;
}

export interface ReportData {
  vehicleCostReport: Array<{
    vehicleId: number;
    plate: string;
    brand: string;
    model: string;
    year: number;
    currentMileage: number;
    driverName: string;
    maintenanceCost: number;
    otherExpensesCost: number;
    totalCost: number;
    costPerKm: number;
  }>;
  topParts: Array<{
    name: string;
    quantity: number;
    totalCost: number;
    category: string;
  }>;
  categoryTotals: Record<string, number>;
  totalOrdersCompleted: number;
}
