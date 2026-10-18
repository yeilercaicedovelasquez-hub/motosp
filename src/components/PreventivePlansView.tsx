import React, { useState, useEffect } from 'react';
import { MaintenancePlan, Vehicle, EventCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Bike,
  Wrench,
  ShieldCheck,
  Disc,
  Zap,
  Gauge,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PreventivePlansViewProps {
  plans: MaintenancePlan[];
  vehicles: Vehicle[];
  onRefresh: () => void;
  onSelectVehicle: (id: number) => void;
  onOpenNewOrder: (vehicleId?: number) => void;
}

export const PreventivePlansView: React.FC<PreventivePlansViewProps> = ({
  plans,
  vehicles,
  onRefresh,
  onSelectVehicle,
  onOpenNewOrder,
}) => {
  const { canEditVehicle, canCreateOrder } = useAuth();
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [vehicleStatuses, setVehicleStatuses] = useState<
    Array<{
      vehicle: Vehicle;
      plans: any[];
      highestUrgency: 'green' | 'yellow' | 'orange' | 'red';
    }>
  >([]);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // New Plan Form
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    category: 'oil' as EventCategory,
    intervalKm: 3000,
    intervalMonths: 3,
    toleranceKm: 300,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch status matrix for each vehicle
  useEffect(() => {
    if (vehicles.length === 0) return;

    setIsLoadingMatrix(true);
    const fetchPromises = vehicles.map((v) =>
      fetch(`/api/vehicles/${v.id}/alerts`)
        .then((r) => r.json())
        .catch(() => null)
    );

    Promise.all(fetchPromises)
      .then((results) => {
        const valid = results.filter((r) => r && r.vehicle);
        setVehicleStatuses(valid);
      })
      .finally(() => setIsLoadingMatrix(false));
  }, [vehicles]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });

      if (!res.ok) throw new Error('Error al crear plan preventivo');

      setIsCreatePlanOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/plans/seed-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Error al cargar planes preventivos');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const getUrgencyBadge = (urgency: 'green' | 'yellow' | 'orange' | 'red') => {
    switch (urgency) {
      case 'red':
        return {
          label: 'Vencido',
          bg: 'bg-red-600 text-white',
          dot: 'bg-red-500 ring-2 ring-red-200',
        };
      case 'orange':
        return {
          label: 'Crítico / Hoy',
          bg: 'bg-orange-500 text-white',
          dot: 'bg-orange-500 ring-2 ring-orange-200',
        };
      case 'yellow':
        return {
          label: 'Próximo',
          bg: 'bg-amber-400 text-slate-950 font-bold',
          dot: 'bg-amber-400',
        };
      case 'green':
        return {
          label: 'Al día',
          bg: 'bg-emerald-100 text-emerald-800',
          dot: 'bg-emerald-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mantenimiento Preventivo y Semáforo de Alertas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuración de intervalos por kilometraje y tiempo con detección automática de vencimientos
          </p>
        </div>

        {canEditVehicle && (
          <button
            onClick={() => setIsCreatePlanOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Configurar Nuevo Plan</span>
          </button>
        )}
      </div>

      {/* Traffic Light Rules Legend */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Código de Colores del Semáforo Preventivo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Verde — Al día:</strong>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                La motocicleta cuenta con kilometraje y tiempo vigentes dentro del intervalo seguro.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900">
            <span className="w-3 h-3 rounded-full bg-amber-400 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Amarillo — Próximo:</strong>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Faltan menos de 600 km o 30 días para alcanzar el próximo servicio.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-orange-50/80 border border-orange-200 text-orange-900">
            <span className="w-3 h-3 rounded-full bg-orange-500 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Naranja — Crítico / Programado:</strong>
              <p className="text-[11px] text-orange-700 mt-0.5">
                Faltan menos de 300 km o 15 días. Requiere agendamiento inmediato en taller.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/80 border border-red-200 text-red-900">
            <span className="w-3 h-3 rounded-full bg-red-600 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold">Rojo — Vencido:</strong>
              <p className="text-[11px] text-red-700 mt-0.5">
                El kilometraje o tiempo superó el límite. Peligro de daño mecánico o pérdida de garantía.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Plans Pills */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Planes Preventivos Parametrizados ({plans.length})
          </h3>
          {canEditVehicle && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedDefaults}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Cargar 6 Planes Estándar
              </button>
              <button
                onClick={() => setIsCreatePlanOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Plan
              </button>
            </div>
          )}
        </div>

        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{p.name}</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">
                    {p.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{p.description || 'Mantenimiento periódico'}</p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    Intervalo: <strong>{p.intervalKm?.toLocaleString()} km</strong>
                  </span>
                  <span className="text-slate-600">
                    Tolerancia: <strong>{p.toleranceKm} km</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No hay planes preventivos parametrizados todavía</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
              Crea tus planes a medida para tu negocio o carga los 6 planes preventivos estándar de motos (Aceite, Frenos, Transmisión, Filtros, Llantas y Tecnomecánica).
            </p>
            {canEditVehicle && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={handleSeedDefaults}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  ⚡ Cargar 6 Planes Estándar con 1 Clic
                </button>
                <button
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Crear Plan Personalizado
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Fleet Semáforo Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Matriz de Estado Preventivo por Motocicleta
          </h3>
          <span className="text-xs text-slate-500">{vehicles.length} motos monitoreadas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-100/50">
                <th className="py-3 px-4">Moto (Placa)</th>
                <th className="py-3 px-4">Odómetro</th>
                <th className="py-3 px-4">Propietario / Cliente</th>
                <th className="py-3 px-4">Estado General</th>
                <th className="py-3 px-4">Componentes en Riesgo / Próximos</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {vehicleStatuses.length > 0 ? (
                vehicleStatuses.map((item) => {
                const badge = getUrgencyBadge(item.highestUrgency);
                const criticalOrWarnPlans = item.plans.filter(
                  (p) => p.urgency === 'red' || p.urgency === 'orange' || p.urgency === 'yellow'
                );

                return (
                  <tr key={item.vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.vehicle.plate}
                        </span>
                        <span className="text-slate-600 font-medium truncate">
                          {item.vehicle.brand} {item.vehicle.model}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.vehicle.currentMileage.toLocaleString('es-CO')} km
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {item.vehicle.ownerName || item.vehicle.driverName || 'Cliente Particular'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {criticalOrWarnPlans.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {criticalOrWarnPlans.map((cp, idx) => (
                            <span
                              key={idx}
                              title={cp.message}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                cp.urgency === 'red'
                                  ? 'bg-red-100 text-red-800'
                                  : cp.urgency === 'orange'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cp.planName}: {cp.message}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Todos los componentes al día
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectVehicle(item.vehicle.id)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Hoja de Vida
                        </button>
                        {canCreateOrder && (
                          <button
                            onClick={() => onOpenNewOrder(item.vehicle.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold"
                          >
                            Crear OT
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center bg-slate-50/50">
                  <Bike className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No hay motocicletas registradas en el taller</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Registra una motocicleta en el catálogo para ver aquí el semáforo preventivo y cálculo de kilometraje en tiempo real.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Maintenance Plan */}
      {isCreatePlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Configurar Plan Preventivo</h3>
              </div>
              <button onClick={() => setIsCreatePlanOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de Aceite y Filtro"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría del Componente</label>
                <select
                  value={newPlan.category}
                  onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value as EventCategory })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="oil">Aceite de Motor</option>
                  <option value="brakes">Frenos y Pastillas</option>
                  <option value="tires">Llantas y Neumáticos</option>
                  <option value="chain_kit">Kit de Arrastre</option>
                  <option value="filters">Filtros (Aire/Combustible)</option>
                  <option value="spark_plugs">Bujías</option>
                  <option value="battery">Batería</option>
                  <option value="paperwork">Documentos (SOAT/Revisión)</option>
                  <option value="general">Mantenimiento General</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intervalo Kilometraje (km)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={newPlan.intervalKm}
                    onChange={(e) => setNewPlan({ ...newPlan, intervalKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intervalo Tiempo (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={newPlan.intervalMonths}
                    onChange={(e) => setNewPlan({ ...newPlan, intervalMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Umbral de Tolerancia Alerta (km)</label>
                <input
                  type="number"
                  min="50"
                  value={newPlan.toleranceKm}
                  onChange={(e) => setNewPlan({ ...newPlan, toleranceKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePlanOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
