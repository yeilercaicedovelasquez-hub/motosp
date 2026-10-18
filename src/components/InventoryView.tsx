import React, { useState } from 'react';
import { PartInventory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowUpDown,
  X,
  Edit2,
  Trash2,
  Boxes,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Tag,
  Wrench,
  Fuel,
  Disc,
  Zap,
  Gauge,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: PartInventory[];
  onRefresh: () => void;
}

const INVENTORY_CATEGORIES = [
  { id: 'all', label: 'Todas las Categorías', icon: Boxes },
  { id: 'Aceites y Líquidos', label: 'Aceites y Líquidos', icon: Fuel },
  { id: 'Frenos', label: 'Frenos y Pastillas', icon: Disc },
  { id: 'Transmisión', label: 'Transmisión y Cadena', icon: Wrench },
  { id: 'Filtros', label: 'Filtros y Bujías', icon: Package },
  { id: 'Eléctrico', label: 'Eléctrico y Baterías', icon: Zap },
  { id: 'Llantas', label: 'Llantas y Neumáticos', icon: Gauge },
  { id: 'Motor', label: 'Motor y Embrague', icon: Layers },
  { id: 'General', label: 'Varios e Insumos', icon: Tag },
];

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onRefresh }) => {
  const { canManageInventory, canDeletePart, canViewFinancials, activeEmployee } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'optimal' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'cost'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal create/edit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartInventory | null>(null);

  // Quick Movement Modal
  const [movementModalPart, setMovementModalPart] = useState<PartInventory | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'set'>('in');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState('');
  const [isProcessingMovement, setIsProcessingMovement] = useState(false);

  const initialForm = {
    code: '',
    name: '',
    category: 'Aceites y Líquidos',
    supplier: '',
    stock: 10,
    minStock: 3,
    unitCost: 25000,
    unitMeasure: 'unidad',
    compatibleModels: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleOpenCreate = () => {
    setEditingPart(null);
    setFormData(initialForm);
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: PartInventory) => {
    setEditingPart(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category,
      supplier: p.supplier || '',
      stock: p.stock,
      minStock: p.minStock,
      unitCost: Number(p.unitCost),
      unitMeasure: p.unitMeasure || 'unidad',
      compatibleModels: p.compatibleModels || '',
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleDelete = async (p: PartInventory) => {
    if (!canDeletePart) {
      alert('Solo el Administrador del taller puede eliminar referencias del catálogo.');
      return;
    }
    if (!confirm(`¿Eliminar definitivamente el repuesto "${p.name}" (${p.code}) del catálogo?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar repuesto');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Stock Adjustment
  const handleQuickAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalPart) return;

    let newStock = movementModalPart.stock;
    if (movementType === 'in') {
      newStock = movementModalPart.stock + Math.max(1, movementQty);
    } else if (movementType === 'out') {
      newStock = Math.max(0, movementModalPart.stock - Math.max(1, movementQty));
    } else {
      newStock = Math.max(0, movementQty);
    }

    setIsProcessingMovement(true);
    try {
      const res = await fetch(`/api/inventory/${movementModalPart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': activeEmployee.email,
          'x-demo-role': activeEmployee.role,
        },
        body: JSON.stringify({
          stock: newStock,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar existencias de repuesto');
      setMovementModalPart(null);
      setMovementQty(1);
      setMovementReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessingMovement(false);
    }
  };

  // Submit create or edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = formData.code.toUpperCase().trim();
    if (!cleanCode || !formData.name.trim()) {
      setFormError('El código SKU y el nombre del repuesto son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingPart ? `/api/inventory/${editingPart.id}` : '/api/inventory';
      const method = editingPart ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': activeEmployee.email,
          'x-demo-role': activeEmployee.role,
        },
        body: JSON.stringify({
          ...formData,
          code: cleanCode,
          stock: Number(formData.stock),
          minStock: Number(formData.minStock),
          unitCost: Number(formData.unitCost),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar repuesto');
      }

      setIsCreateOpen(false);
      setEditingPart(null);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
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

  // Filter and sort items
  const filteredInventory = inventory
    .filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      let matchesStatus = true;
      if (stockStatusFilter === 'out') matchesStatus = item.stock === 0;
      else if (stockStatusFilter === 'low') matchesStatus = item.stock > 0 && item.stock <= item.minStock;
      else if (stockStatusFilter === 'optimal') matchesStatus = item.stock > item.minStock;

      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        (item.supplier && item.supplier.toLowerCase().includes(term)) ||
        (item.compatibleModels && item.compatibleModels.toLowerCase().includes(term));

      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      } else if (sortBy === 'cost') {
        comparison = Number(a.unitCost) - Number(b.unitCost);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // KPI calculations
  const totalItems = inventory.length;
  const outOfStockCount = inventory.filter((i) => i.stock === 0).length;
  const lowStockCount = inventory.filter((i) => i.stock > 0 && i.stock <= i.minStock).length;
  const totalInventoryValue = inventory.reduce(
    (acc, curr) => acc + curr.stock * (Number(curr.unitCost) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Almacén & Inventario de Repuestos</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold border border-amber-500/20">
              Bodega del Taller
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organización por categorías, control de existencias mínimas, compatibilidad de motos y ajustes de bodega
          </p>
        </div>

        {canManageInventory && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Nuevo Repuesto</span>
          </button>
        )}
      </div>

      {/* Structured KPI Header Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Referencias Totales</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalItems} <span className="text-xs font-normal text-slate-500">ítems</span></p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Stock Crítico</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">
              {lowStockCount} <span className="text-xs font-normal text-amber-600">por reponer</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Agotados (0 uds)</p>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{outOfStockCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <X className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Valorización Almacén</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              {canViewFinancials ? formatCurrency(totalInventoryValue) : '••••••'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Tabs Strip for High Organization */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {INVENTORY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? inventory.length
                : inventory.filter((i) => i.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Stock Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código SKU, nombre de repuesto, marca, moto compatible..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Estado:</span>
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
              stockStatusFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStockStatusFilter('optimal')}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
              stockStatusFilter === 'optimal'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Óptimo
          </button>
          <button
            onClick={() => setStockStatusFilter('low')}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors flex items-center gap-1 ${
              stockStatusFilter === 'low'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Stock Bajo ({lowStockCount})
          </button>
          <button
            onClick={() => setStockStatusFilter('out')}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
              stockStatusFilter === 'out'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Agotados ({outOfStockCount})
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs text-slate-700">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="name">Ordenar por Nombre</option>
            <option value="stock">Ordenar por Stock</option>
            <option value="cost">Ordenar por Costo</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white rounded border border-slate-200 hover:bg-slate-100"
            title="Cambiar orden ascendente/descendente"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron repuestos</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {search || selectedCategory !== 'all' || stockStatusFilter !== 'all'
              ? 'No hay repuestos que coincidan con la categoría o filtros seleccionados.'
              : 'El almacén del taller no tiene repuestos registrados todavía.'}
          </p>
          {canManageInventory && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Repuesto</span>
            </button>
          )}
        </div>
      )}

      {/* Highly Organized Inventory Table */}
      {filteredInventory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Código SKU</th>
                  <th className="py-3.5 px-4">Repuesto / Categoría</th>
                  <th className="py-3.5 px-4">Motos Compatibles</th>
                  <th className="py-3.5 px-4">Nivel de Existencia</th>
                  <th className="py-3.5 px-4">Costo Taller</th>
                  <th className="py-3.5 px-4">Proveedor</th>
                  <th className="py-3.5 px-4 text-right">Movimiento de Bodega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const isOut = item.stock === 0;
                  const isLow = !isOut && item.stock <= item.minStock;
                  const percentOfMin = Math.min(100, Math.round((item.stock / (item.minStock * 2 || 1)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                          {item.code}
                        </span>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500">{item.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400 capitalize">{item.unitMeasure || 'unidad'}</span>
                        </div>
                      </td>

                      {/* Compatibility */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {item.compatibleModels ? (
                          <div className="flex flex-wrap gap-1">
                            {item.compatibleModels
                              .split(',')
                              .slice(0, 3)
                              .map((m, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium truncate max-w-[130px]"
                                >
                                  {m.trim()}
                                </span>
                              ))}
                            {item.compatibleModels.split(',').length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{item.compatibleModels.split(',').length - 3} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Universal / Multimarca</span>
                        )}
                      </td>

                      {/* Stock Visual Level */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                              }`}
                            >
                              {item.stock}
                            </span>
                            <span className="text-slate-400 text-[10px]">/ mín {item.minStock}</span>
                          </div>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full border ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Óptimo'}
                          </span>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, percentOfMin)}%` }}
                          />
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {canViewFinancials ? formatCurrency(item.unitCost) : '••••••'}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.supplier ? (
                          <span className="truncate block max-w-[130px]" title={item.supplier}>
                            {item.supplier}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Local / Directo</span>
                        )}
                      </td>

                      {/* Actions & Fast Stock Button */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageInventory && (
                            <>
                              <button
                                onClick={() => {
                                  setMovementModalPart(item);
                                  setMovementType('in');
                                  setMovementQty(1);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                                title="Ingresar o retirar existencias"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ajustar</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar repuesto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {canDeletePart && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar repuesto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Movement Modal */}
      {movementModalPart && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Movimiento de Bodega</h3>
                  <p className="text-xs text-slate-500">
                    {movementModalPart.name} ({movementModalPart.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMovementModalPart(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Existencias actuales en estantería:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {movementModalPart.stock} {movementModalPart.unitMeasure || 'unidades'}
              </span>
            </div>

            <form onSubmit={handleQuickAdjust} className="space-y-4 text-xs">
              {/* Movement Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Tipo de Movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('in')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all ${
                      movementType === 'in'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Entrada Proveedor
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('out')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all ${
                      movementType === 'out'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Salida Taller
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('set')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all ${
                      movementType === 'set'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    = Conteo Físico
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {movementType === 'set' ? 'Nueva Cantidad Total Exacta' : 'Cantidad a Ajustar'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo / Orden o Factura de Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Factura #8491 Distribuidora Motos / Consumo moto WKM-42F"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Result Preview */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <span>Stock resultante después del ajuste:</span>
                <span className="font-mono font-bold text-sm">
                  {movementType === 'in'
                    ? movementModalPart.stock + Math.max(1, movementQty)
                    : movementType === 'out'
                    ? Math.max(0, movementModalPart.stock - Math.max(1, movementQty))
                    : Math.max(0, movementQty)}{' '}
                  {movementModalPart.unitMeasure || 'uds'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovementModalPart(null)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingMovement}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isProcessingMovement ? 'Aplicando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Part */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingPart ? `Editar Repuesto ${editingPart.code}` : 'Registrar Nuevo Repuesto'}
                  </h3>
                  <p className="text-xs text-slate-500">Ficha técnica para el almacén y cotizaciones</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. REP-MOT-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Aceites y Líquidos">Aceites y Líquidos</option>
                    <option value="Frenos">Frenos y Pastillas</option>
                    <option value="Transmisión">Transmisión y Kit Arrastre</option>
                    <option value="Filtros">Filtros y Bujías</option>
                    <option value="Eléctrico">Eléctrico y Baterías</option>
                    <option value="Llantas">Llantas y Neumáticos</option>
                    <option value="Motor">Motor y Embrague</option>
                    <option value="General">Varios e Insumos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Repuesto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pastillas de Freno Delanteras Cerámicas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    placeholder="Distribuidora de Repuestos S.A.S."
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    placeholder="unidad / litro / par / kit"
                    value={formData.unitMeasure}
                    onChange={(e) => setFormData({ ...formData, unitMeasure: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motos Compatibles (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Yamaha FZ-25, MT-03, Suzuki Gixxer, Pulsar NS200"
                  value={formData.compatibleModels}
                  onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingPart ? 'Actualizar Repuesto' : 'Registrar en Almacén'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
