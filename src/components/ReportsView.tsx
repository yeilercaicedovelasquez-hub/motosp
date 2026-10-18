import React, { useState, useEffect } from 'react';
import { ReportData, Vehicle } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BarChart3,
  DollarSign,
  Download,
  Printer,
  TrendingUp,
  Fuel,
  Wrench,
  Package,
  Plus,
  X,
  FileSpreadsheet,
  Layers,
  Bike,
} from 'lucide-react';

interface ReportsViewProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ vehicles, onRefresh }) => {
  const { canCreateOrder } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New Expense Form
  const [newExpense, setNewExpense] = useState({
    vehicleId: vehicles[0]?.id || 1,
    category: 'fuel' as 'fuel' | 'toll' | 'fine' | 'wash' | 'parking' | 'other',
    amount: '',
    mileage: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setIsLoading(true);
    fetch('/api/reports')
      .then((r) => r.json())
      .then((data) => setReportData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: Number(newExpense.vehicleId),
          category: newExpense.category,
          amount: String(newExpense.amount),
          mileage: newExpense.mileage ? Number(newExpense.mileage) : undefined,
          expenseDate: newExpense.expenseDate,
          notes: newExpense.notes,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar gasto');

      setIsAddExpenseOpen(false);
      setNewExpense({
        vehicleId: vehicles[0]?.id || 1,
        category: 'fuel',
        amount: '',
        mileage: '',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      fetchReports();
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

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (!reportData?.vehicleCostReport) return;

    const headers = [
      'Placa',
      'Marca y Modelo',
      'Ano',
      'Odometro (km)',
      'Propietario / Cliente',
      'Costo Mantenimiento ($)',
      'Otros Gastos ($)',
      'Costo Total ($)',
      'Costo por Km ($/km)',
    ];

    const rows = reportData.vehicleCostReport.map((v) => [
      v.plate,
      `"${v.brand} ${v.model}"`,
      v.year,
      v.currentMileage,
      `"${v.ownerName || v.driverName || 'Cliente Particular'}"`,
      v.maintenanceCost,
      v.otherExpensesCost,
      v.totalCost,
      v.costPerKm,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Costos_MotoGestion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const totalFleetCost =
    reportData?.vehicleCostReport.reduce((acc, curr) => acc + curr.totalCost, 0) || 0;
  const totalFleetKm =
    reportData?.vehicleCostReport.reduce((acc, curr) => acc + curr.currentMileage, 0) || 0;
  const avgCostPerKm = totalFleetKm > 0 ? (totalFleetCost / totalFleetKm).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Análisis Financiero y Reportes de Costos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Costo por kilómetro recorrido ($/km), consumo de repuestos e indicadores por motocicleta
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateOrder && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Registrar Gasto</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            title="Descargar archivo Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Inversión Total Flota</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalFleetCost)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Mantenimientos + Operación</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Costo Promedio Flota</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">${avgCostPerKm} <span className="text-xs font-normal text-slate-500">/ km</span></p>
          <span className="text-[11px] text-slate-400 mt-1 block">Eficiencia operativa</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Kilómetros Totales Flota</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalFleetKm.toLocaleString()} km</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Odómetro acumulado</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Órdenes Finalizadas</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {reportData?.totalOrdersCompleted || 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Completadas con éxito</span>
        </div>
      </div>

      {/* Main Table: Vehicle Cost & $/km Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Comparativa de Costo Acumulado y $/KM por Motocicleta
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {reportData?.vehicleCostReport.length || 0} vehículos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Placa y Moto</th>
                <th className="py-3 px-4">Propietario / Cliente</th>
                <th className="py-3 px-4">Odómetro</th>
                <th className="py-3 px-4">Mantenimiento</th>
                <th className="py-3 px-4">Otros Gastos</th>
                <th className="py-3 px-4">Costo Total</th>
                <th className="py-3 px-4 font-mono">Costo / Km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {reportData?.vehicleCostReport.map((v) => (
                <tr key={v.vehicleId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mr-2">
                      {v.plate}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {v.brand} {v.model}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {v.ownerName || v.driverName || 'Cliente Particular'}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {v.currentMileage.toLocaleString('es-CO')} km
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {formatCurrency(v.maintenanceCost)}
                  </td>

                  <td className="py-3 px-4 text-slate-600">{formatCurrency(v.otherExpensesCost)}</td>

                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                    {formatCurrency(v.totalCost)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">${v.costPerKm}</span>
                      <span className="text-[10px] text-slate-400">/km</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns: Top Spare Parts Consumed & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Consumed Parts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Repuestos Más Utilizados (Mayor Consumo)
            </h3>
          </div>

          <div className="space-y-3">
            {reportData?.topParts && reportData.topParts.length > 0 ? (
              reportData.topParts.slice(0, 5).map((part, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{part.name}</span>
                    <span className="text-[10px] text-slate-400">{part.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">{part.quantity} unid.</span>
                    <span className="text-[11px] text-slate-500">{formatCurrency(part.totalCost)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No hay datos de repuestos utilizados.</p>
            )}
          </div>
        </div>

        {/* Right: Distribution by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Distribución de Inversión por Categoría
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg">
              <span className="font-semibold text-emerald-900">Mantenimiento Preventivo</span>
              <strong className="font-bold text-emerald-950">
                {formatCurrency(reportData?.categoryTotals.preventive || 0)}
              </strong>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-100 rounded-lg">
              <span className="font-semibold text-amber-900">Mantenimiento Correctivo y Reparaciones</span>
              <strong className="font-bold text-amber-950">
                {formatCurrency(reportData?.categoryTotals.corrective || 0)}
              </strong>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
              <span className="font-semibold text-blue-900">Documentos, SOAT y Trámites</span>
              <strong className="font-bold text-blue-950">
                {formatCurrency(reportData?.categoryTotals.paperwork || 0)}
              </strong>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-purple-50/70 border border-purple-100 rounded-lg">
              <span className="font-semibold text-purple-900">Combustible y Peajes</span>
              <strong className="font-bold text-purple-950">
                {formatCurrency(reportData?.categoryTotals.fuel || 0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register New Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Registrar Gasto Operativo</h3>
              </div>
              <button onClick={() => setIsAddExpenseOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motocicleta *</label>
                {vehicles.length > 0 ? (
                  <select
                    value={newExpense.vehicleId}
                    onChange={(e) => setNewExpense({ ...newExpense, vehicleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-semibold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                    ⚠️ No hay motocicletas registradas. Registra una moto en el catálogo para asociarle gastos.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Gasto</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="fuel">Combustible (Gasolina)</option>
                    <option value="toll">Peaje</option>
                    <option value="wash">Lavado y Engrase</option>
                    <option value="parking">Parqueadero</option>
                    <option value="fine">Comparendo / Multa</option>
                    <option value="other">Otro Gasto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 35000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newExpense.expenseDate}
                    onChange={(e) => setNewExpense({ ...newExpense, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Odómetro (km)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Opcional"
                    value={newExpense.mileage}
                    onChange={(e) => setNewExpense({ ...newExpense, mileage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Factura</label>
                <input
                  type="text"
                  placeholder="Detalles sobre estación de servicio o comprobante..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || vehicles.length === 0}
                  className={`px-4 py-1.5 font-bold rounded-lg transition-all ${
                    vehicles.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
