import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Plus,
  Minus,
  Package,
  Wrench,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PartInventory } from '../types';

interface SelectedPartItem {
  partId: number;
  quantity: number;
  unitCost: number;
  name: string;
}

interface MultiPartSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PartInventory[];
  alreadySelected: SelectedPartItem[];
  onConfirm: (selectedParts: SelectedPartItem[]) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'Aceites y Fluidos', label: 'Aceites y Fluidos' },
  { id: 'Frenos', label: 'Frenos' },
  { id: 'Transmisión', label: 'Transmisión' },
  { id: 'Filtros', label: 'Filtros' },
  { id: 'Eléctrico', label: 'Eléctrico' },
  { id: 'Motor', label: 'Motor' },
  { id: 'Llantas y Neumáticos', label: 'Llantas' },
];

export const MultiPartSelectorModal: React.FC<MultiPartSelectorModalProps> = ({
  isOpen,
  onClose,
  inventory,
  alreadySelected,
  onConfirm,
}) => {
  if (!isOpen) return null;

  // Local selection map: partId -> quantity
  const [selectedMap, setSelectedMap] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    alreadySelected.forEach((p) => {
      map[p.partId] = p.quantity;
    });
    return map;
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Format currency
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.compatibleModels && item.compatibleModels.toLowerCase().includes(search.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchStock = !onlyInStock || item.stock > 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [inventory, search, selectedCategory, onlyInStock]);

  // Handle toggle selection
  const handleTogglePart = (part: PartInventory) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[part.id]) {
        delete next[part.id];
      } else {
        next[part.id] = 1;
      }
      return next;
    });
  };

  // Update quantity
  const handleUpdateQty = (partId: number, delta: number, maxStock: number) => {
    setSelectedMap((prev) => {
      const current = prev[partId] || 0;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[partId];
        return copy;
      }
      return {
        ...prev,
        [partId]: nextQty,
      };
    });
  };

  const handleSetExactQty = (partId: number, qty: number) => {
    if (qty <= 0 || isNaN(qty)) {
      setSelectedMap((prev) => {
        const copy = { ...prev };
        delete copy[partId];
        return copy;
      });
      return;
    }
    setSelectedMap((prev) => ({
      ...prev,
      [partId]: qty,
    }));
  };

  // Select all visible
  const handleSelectAllVisible = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredInventory.forEach((item) => {
        if (item.stock > 0 && !next[item.id]) {
          next[item.id] = 1;
        }
      });
      return next;
    });
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedMap({});
  };

  // Quick workshop presets / kits
  const handleApplyPreset = (keywords: string[]) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      inventory.forEach((item) => {
        const combined = `${item.name} ${item.category} ${item.code}`.toLowerCase();
        const matches = keywords.some((kw) => combined.includes(kw.toLowerCase()));
        if (matches && item.stock > 0) {
          next[item.id] = (next[item.id] || 0) + 1;
        }
      });
      return next;
    });
  };

  // Summary calculations
  const selectedCount = Object.keys(selectedMap).length;
  const totalUnits = (Object.values(selectedMap) as number[]).reduce((a: number, b: number) => a + Number(b), 0);

  const totalCost = useMemo(() => {
    return (Object.entries(selectedMap) as [string, number][]).reduce((sum: number, [partIdStr, qty]) => {
      const part = inventory.find((p) => p.id === Number(partIdStr));
      if (!part) return sum;
      return sum + Number(part.unitCost) * Number(qty);
    }, 0);
  }, [selectedMap, inventory]);

  // Confirm and return
  const handleSave = () => {
    const result: SelectedPartItem[] = [];
    (Object.entries(selectedMap) as [string, number][]).forEach(([partIdStr, qty]) => {
      const part = inventory.find((p) => p.id === Number(partIdStr));
      const numericQty = Number(qty);
      if (part && numericQty > 0) {
        result.push({
          partId: part.id,
          name: part.name,
          quantity: numericQty,
          unitCost: Number(part.unitCost),
        });
      }
    });
    onConfirm(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Selección Múltiple de Repuestos
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {selectedCount} seleccionados
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Marca todos los repuestos necesarios para la orden de trabajo y define sus cantidades.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets / Kits de Taller */}
        <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Kits Rápidos de Taller:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset(['aceite', 'filtro aceite'])}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 font-semibold shadow-2xs hover:border-amber-300 transition-colors"
          >
            🛢️ Kit Cambio de Aceite
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(['pastilla', 'freno', 'liquido'])}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 font-semibold shadow-2xs hover:border-amber-300 transition-colors"
          >
            🛑 Kit Frenos Completos
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(['cadena', 'arrastre', 'lubricante'])}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 font-semibold shadow-2xs hover:border-amber-300 transition-colors"
          >
            ⛓️ Kit Arrastre & Cadena
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(['bujia', 'filtro aire', 'aceite'])}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 font-semibold shadow-2xs hover:border-amber-300 transition-colors"
          >
            ⚡ Kit Afinación Preventiva
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar repuesto por nombre, SKU, marca o compatibilidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
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

            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium select-none px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                Solo con Stock
              </label>

              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                title="Seleccionar todos los repuestos visibles"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                Marcar Todos
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 text-rose-500" />
                  Limpiar ({selectedCount})
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-amber-400 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Inventory Items */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Package className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No se encontraron repuestos con los filtros actuales</p>
              <p className="text-[11px] text-slate-400">Prueba ajustando el término de búsqueda o categoría.</p>
            </div>
          ) : (
            filteredInventory.map((item) => {
              const isSelected = !!selectedMap[item.id];
              const qty = selectedMap[item.id] || 0;
              const isOutOfStock = item.stock <= 0;
              const isLowStock = item.stock > 0 && item.stock <= item.minStock;

              return (
                <div
                  key={item.id}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/70 border border-amber-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  } ${isOutOfStock ? 'opacity-60 bg-slate-50/50' : ''}`}
                >
                  {/* Left: Checkbox & Item details */}
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleTogglePart(item)}
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-2xs'
                          : isOutOfStock
                          ? 'bg-slate-200 border border-slate-300 cursor-not-allowed'
                          : 'border-2 border-slate-300 hover:border-amber-500 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        {item.compatibleModels && (
                          <span>
                            Compatibilidad:{' '}
                            <strong className="text-slate-700">{item.compatibleModels}</strong>
                          </span>
                        )}
                        <span className="font-semibold text-emerald-700">
                          Precio Unitario: {formatCurrency(item.unitCost)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sin Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Bajo Stock ({item.stock} disp.)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {item.stock} disponibles en almacén
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1, item.stock)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={qty}
                            onChange={(e) => handleSetExactQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xs font-bold text-slate-900 py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1, item.stock)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span className="text-[10px] text-slate-400 block">Subtotal</span>
                          <span className="text-xs font-bold text-slate-900">
                            {formatCurrency(qty * Number(item.unitCost))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleTogglePart(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Seleccionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Footer: Total & Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="text-xs text-slate-500 block">
                {selectedCount} {selectedCount === 1 ? 'repuesto seleccionado' : 'repuestos seleccionados'} ({totalUnits} unidades)
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900">
                Total Estimado: <span className="text-emerald-700 font-extrabold">{formatCurrency(totalCost)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              Aplicar {selectedCount} Repuestos a la Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
