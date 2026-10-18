import React, { useState } from 'react';
import {
  WorkOrder,
  Vehicle,
  PartInventory,
  OrderStatus,
  OrderPriority,
} from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MultiPartSelectorModal } from './MultiPartSelectorModal.tsx';
import {
  Wrench,
  Plus,
  Minus,
  Search,
  Filter,
  Calendar,
  Gauge,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  X,
  User,
  Bike,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface WorkOrdersViewProps {
  orders: WorkOrder[];
  vehicles: Vehicle[];
  inventory: PartInventory[];
  onRefresh: () => void;
  isOpenCreate: boolean;
  setIsOpenCreate: (val: boolean) => void;
  defaultVehicleId?: number;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  orders,
  vehicles,
  inventory,
  onRefresh,
  isOpenCreate,
  setIsOpenCreate,
  defaultVehicleId,
}) => {
  const { canCreateOrder } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Form State for new order
  const [formData, setFormData] = useState({
    vehicleId: defaultVehicleId || vehicles[0]?.id || 1,
    priority: 'medium' as OrderPriority,
    technicianName: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    currentMileage: 0,
    laborCost: '0',
    parts: [] as Array<{ partId: number; quantity: number; unitCost: number; name: string }>,
    photosBefore: [] as string[],
  });

  // Multi-part selector modal state
  const [isMultiPartModalOpen, setIsMultiPartModalOpen] = useState(false);

  // Edit / Status resolution form
  const [editStatus, setEditStatus] = useState<OrderStatus>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [isUpdating, setIsSubmitting] = useState(false);

  // When order opens in detail
  const handleOpenDetail = (order: WorkOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setResolutionNotes(order.resolutionNotes || '');
    try {
      setPhotosAfter(order.photosAfterJson ? JSON.parse(order.photosAfterJson) : []);
    } catch (e) {
      setPhotosAfter([]);
    }
  };

  // Add a spare part to order
  const handleAddPart = (partId: number) => {
    const part = inventory.find((p) => p.id === partId);
    if (!part) return;

    setFormData((prev) => {
      const exists = prev.parts.find((p) => p.partId === partId);
      if (exists) {
        return {
          ...prev,
          parts: prev.parts.map((p) =>
            p.partId === partId ? { ...p, quantity: p.quantity + 1 } : p
          ),
        };
      }
      return {
        ...prev,
        parts: [
          ...prev.parts,
          {
            partId: part.id,
            name: part.name,
            quantity: 1,
            unitCost: Number(part.unitCost),
          },
        ],
      };
    });
  };

  const handleUpdatePartQty = (partId: number, delta: number) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts
        .map((p) => {
          if (p.partId === partId) {
            const next = p.quantity + delta;
            return next > 0 ? { ...p, quantity: next } : null;
          }
          return p;
        })
        .filter(Boolean) as typeof prev.parts,
    }));
  };

  const handleConfirmMultiParts = (
    selectedParts: Array<{ partId: number; quantity: number; unitCost: number; name: string }>
  ) => {
    setFormData((prev) => ({
      ...prev,
      parts: selectedParts,
    }));
  };

  const handleApplyKitPreset = (keywords: string[]) => {
    const matchedParts: typeof formData.parts = [];
    inventory.forEach((item) => {
      const combined = `${item.name} ${item.category} ${item.code}`.toLowerCase();
      const matches = keywords.some((kw) => combined.includes(kw.toLowerCase()));
      if (matches && item.stock > 0) {
        matchedParts.push({
          partId: item.id,
          name: item.name,
          quantity: 1,
          unitCost: Number(item.unitCost),
        });
      }
    });

    if (matchedParts.length === 0) return;

    setFormData((prev) => {
      const existing = [...prev.parts];
      matchedParts.forEach((m) => {
        const idx = existing.findIndex((p) => p.partId === m.partId);
        if (idx >= 0) {
          existing[idx].quantity += 1;
        } else {
          existing.push(m);
        }
      });
      return { ...prev, parts: existing };
    });
  };

  const handleRemovePart = (partId: number) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((p) => p.partId !== partId),
    }));
  };

  // Upload Photo Before
  const handleUploadPhotoBefore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        photosBefore: [...prev.photosBefore, reader.result as string],
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload Photo After
  const handleUploadPhotoAfter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotosAfter((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  // Submit new Work Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedV = vehicles.find((v) => v.id === Number(formData.vehicleId));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: Number(formData.vehicleId),
          status: 'pending',
          priority: formData.priority,
          technicianName: formData.technicianName,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          currentMileage: formData.currentMileage || selectedV?.currentMileage || 0,
          laborCost: formData.laborCost,
          photosBeforeJson: JSON.stringify(formData.photosBefore),
          parts: formData.parts.map((p) => ({
            partId: p.partId,
            quantity: p.quantity,
            unitCost: p.unitCost,
          })),
        }),
      });

      if (!res.ok) throw new Error('Error al crear orden de trabajo');

      setIsOpenCreate(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update order status & resolution
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          resolutionNotes,
          photosAfterJson: JSON.stringify(photosAfter),
          executionDate: editStatus === 'completed' ? new Date().toISOString().split('T')[0] : selectedOrder.executionDate,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar orden');

      setSelectedOrder(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPriorityBadge = (p: OrderPriority) => {
    switch (p) {
      case 'critical':
        return 'bg-red-600 text-white font-bold';
      case 'high':
        return 'bg-orange-500 text-white font-semibold';
      case 'medium':
        return 'bg-amber-400 text-slate-900 font-semibold';
      case 'low':
        return 'bg-slate-200 text-slate-700';
    }
  };

  const getStatusBadge = (s: OrderStatus) => {
    switch (s) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || o.priority === priorityFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      o.orderNumber.toLowerCase().includes(term) ||
      o.description.toLowerCase().includes(term) ||
      (o.vehicle?.plate && o.vehicle.plate.toLowerCase().includes(term)) ||
      (o.technicianName && o.technicianName.toLowerCase().includes(term));
    return matchesStatus && matchesSearch && matchesPriority;
  });

  const calculatedPartsTotal = formData.parts.reduce(
    (acc, curr) => acc + curr.quantity * curr.unitCost,
    0
  );
  const calculatedGrandTotal = (Number(formData.laborCost) || 0) + calculatedPartsTotal;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Órdenes de Trabajo de Mantenimiento</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de reparaciones en taller, asignación técnica, descuento de inventario y evidencias fotográficas
          </p>
        </div>

        {canCreateOrder && (
          <button
            onClick={() => {
              setFormData({
                vehicleId: defaultVehicleId || vehicles[0]?.id || 1,
                priority: 'medium',
                technicianName: '',
                description: '',
                scheduledDate: new Date().toISOString().split('T')[0],
                currentMileage: vehicles[0]?.currentMileage || 0,
                laborCost: '0',
                parts: [],
                photosBefore: [],
              });
              setIsOpenCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Orden de Trabajo</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por # Orden, placa, técnico o problema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendientes' },
              { id: 'in_progress', label: 'En Proceso' },
              { id: 'completed', label: 'Finalizadas' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === st.id ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Prioridad: Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => handleOpenDetail(order)}
            className="bg-white rounded-xl border border-slate-200 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all p-5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header: Order Number & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900">{order.orderNumber}</span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                  {order.status === 'pending'
                    ? 'Pendiente'
                    : order.status === 'in_progress'
                    ? 'En Proceso'
                    : order.status === 'completed'
                    ? 'Finalizada'
                    : 'Cancelada'}
                </span>
              </div>

              {/* Moto Info & Priority */}
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  <Bike className="w-3.5 h-3.5 text-amber-500" />
                  <span>{order.vehicle?.plate || 'MOTO'}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityBadge(order.priority)}`}>
                  {order.priority.toUpperCase()}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 font-medium mt-3 line-clamp-2 leading-relaxed">
                {order.description}
              </p>

              {/* Specs & Technician */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Técnico:</span>
                  <strong className="text-slate-800">{order.technicianName || 'Por asignar'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fecha programada:</span>
                  <span>{order.scheduledDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kilometraje:</span>
                  <span>{order.currentMileage.toLocaleString()} km</span>
                </div>
              </div>
            </div>

            {/* Total Cost & Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Costo Total</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(order.totalCost)}</span>
              </div>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                Ver detalle <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No hay órdenes de trabajo encontradas</p>
          <p className="text-xs text-slate-500 mt-0.5">Ajusta los filtros o crea una nueva orden para tu taller.</p>
        </div>
      )}

      {/* Modal: Create Work Order */}
      {isOpenCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Crear Orden de Mantenimiento</h3>
              </div>
              <button onClick={() => setIsOpenCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              {/* Row 1: Moto, Prioridad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motocicleta <span className="text-red-500">*</span>
                  </label>
                  {vehicles.length > 0 ? (
                    <select
                      value={formData.vehicleId}
                      onChange={(e) => {
                        const vId = Number(e.target.value);
                        const selV = vehicles.find((v) => v.id === vId);
                        setFormData({
                          ...formData,
                          vehicleId: vId,
                          currentMileage: selV ? selV.currentMileage : formData.currentMileage,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.brand} {v.model} ({v.currentMileage} km)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                      ⚠️ No hay motos registradas. Registra primero una moto en el catálogo para crear una orden.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Prioridad <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as OrderPriority })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="critical">Crítica (Moto varada o riesgo)</option>
                    <option value="high">Alta (Urgente en 24h)</option>
                    <option value="medium">Media (Programada normal)</option>
                    <option value="low">Baja (Preventivo rutinario)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Técnico, Odómetro, Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Técnico Mecánico</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Andrés Morales"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Odómetro de Ingreso (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.currentMileage}
                    onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción del Trabajo o Falla Reportada <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detallar mantenimiento a realizar o síntoma mecánico reportado por el cliente o propietario..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Repuestos del Inventario a Utilizar - Multi-Selection System */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-500" />
                      Repuestos e Insumos del Almacén ({formData.parts.length} seleccionados)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Subtotal Repuestos: <strong className="text-emerald-700">{formatCurrency(calculatedPartsTotal)}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMultiPartModalOpen(true)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    + Seleccionar Varios Repuestos del Catálogo
                  </button>
                </div>

                {/* Kits Rápidos Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Kits Rápidos:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyKitPreset(['aceite', 'filtro aceite'])}
                    className="px-2 py-0.5 bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:border-amber-300 rounded text-[11px] font-medium transition-colors"
                  >
                    🛢️ Aceite + Filtro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyKitPreset(['pastilla', 'freno', 'liquido'])}
                    className="px-2 py-0.5 bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:border-amber-300 rounded text-[11px] font-medium transition-colors"
                  >
                    🛑 Pastillas Frenos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyKitPreset(['cadena', 'arrastre', 'lubricante'])}
                    className="px-2 py-0.5 bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:border-amber-300 rounded text-[11px] font-medium transition-colors"
                  >
                    ⛓️ Transmisión
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyKitPreset(['bujia', 'filtro aire'])}
                    className="px-2 py-0.5 bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:border-amber-300 rounded text-[11px] font-medium transition-colors"
                  >
                    ⚡ Afinación
                  </button>
                </div>

                {/* Fast In-line selector for individual additions */}
                <div className="flex items-center gap-2">
                  <select
                    id="partSelect"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddPart(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>
                      + Agregar repuesto adicional de la lista...
                    </option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                        {item.name} ({item.code}) — Stock: {item.stock} | {formatCurrency(item.unitCost)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Parts List with Steppers & Delete */}
                {formData.parts.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {formData.parts.map((p) => {
                      const itemStock = inventory.find((inv) => inv.id === p.partId)?.stock ?? 999;
                      const exceedsStock = p.quantity > itemStock;

                      return (
                        <div
                          key={p.partId}
                          className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-800 truncate block">{p.name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>Unitario: {formatCurrency(p.unitCost)}</span>
                              {exceedsStock && (
                                <span className="text-red-600 font-bold flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Solo {itemStock} en stock
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                              <button
                                type="button"
                                onClick={() => handleUpdatePartQty(p.partId, -1)}
                                className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                                title="Disminuir cantidad"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-bold text-slate-800 text-xs">
                                {p.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdatePartQty(p.partId, 1)}
                                className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                                title="Aumentar cantidad"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-bold text-slate-900 min-w-[70px] text-right">
                              {formatCurrency(p.quantity * p.unitCost)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemovePart(p.partId)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                              title="Quitar repuesto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    No se han seleccionado repuestos para esta orden aún. Haz clic en <strong>+ Seleccionar Varios Repuestos</strong> para elegirlos en lote.
                  </div>
                )}
              </div>

              {/* Labor Cost & Grand Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Mano de Obra ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500">Costo Total Estimado:</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(calculatedGrandTotal)}</span>
                </div>
              </div>

              {/* Photos Before */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Fotos del ANTES (Estado Inicial)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-2 border border-dashed border-slate-300 hover:border-amber-500 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 bg-slate-50">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Subir foto antes del servicio</span>
                    <input type="file" accept="image/*" onChange={handleUploadPhotoBefore} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">{formData.photosBefore.length} foto(s) cargada(s)</span>
                </div>

                {formData.photosBefore.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {formData.photosBefore.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Foto Antes"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenCreate(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || vehicles.length === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    vehicles.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isUpdating ? 'Creando Orden...' : 'Crear Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Update Order Details & Evidences */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-900 text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Orden de Trabajo {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Placa: <strong>{selectedOrder.vehicle?.plate || 'MOTO'}</strong> — {selectedOrder.vehicle?.brand}{' '}
                    {selectedOrder.vehicle?.model}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Order Status Selector */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Estado de la Orden:</label>
                  <p className="text-[11px] text-slate-500">
                    Al marcar 'Finalizada', se cerrará la orden y se añadirá a la Hoja de Vida.
                  </p>
                </div>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="completed">Finalizada (Aprobada)</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Trabajo Solicitado</span>
                <p className="text-xs text-slate-800 mt-1 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedOrder.description}
                </p>
              </div>

              {/* Parts Used list */}
              {selectedOrder.partsUsed && selectedOrder.partsUsed.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Repuestos Instalados</span>
                  <div className="mt-1 space-y-1">
                    {selectedOrder.partsUsed.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-slate-800">{p.partName} ({p.partCode})</span>
                        <span>Cant: {p.quantity} | Total: {formatCurrency(p.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Costs Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500">Mano de Obra:</span>
                  <p className="font-bold text-slate-800">{formatCurrency(selectedOrder.laborCost)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Repuestos:</span>
                  <p className="font-bold text-slate-800">{formatCurrency(selectedOrder.partsCost)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Costo Total:</span>
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(selectedOrder.totalCost)}</p>
                </div>
              </div>

              {/* Resolution notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de Resolución Técnica / Diagnóstico Final
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre pruebas de ruta, calibración o recomendaciones para el cliente o propietario..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Photos After */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Fotos del DESPUÉS (Evidencia de Trabajo Terminado)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-2 border border-dashed border-slate-300 hover:border-amber-500 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 bg-slate-50">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Subir foto después del servicio</span>
                    <input type="file" accept="image/*" onChange={handleUploadPhotoAfter} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">{photosAfter.length} foto(s)</span>
                </div>

                {photosAfter.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {photosAfter.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Foto Después"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Part Inventory Selector Modal */}
      <MultiPartSelectorModal
        isOpen={isMultiPartModalOpen}
        onClose={() => setIsMultiPartModalOpen(false)}
        inventory={inventory}
        alreadySelected={formData.parts}
        onConfirm={handleConfirmMultiParts}
      />
    </div>
  );
};
