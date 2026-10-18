import React from 'react';
import { DashboardStats, WorkOrder, Vehicle } from '../types.ts';
import {
  Bike,
  Wrench,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Package,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Plus,
  CalendarClock,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentOrders: WorkOrder[];
  vehicles: Vehicle[];
  onSelectVehicle: (vehicleId: number) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenNewOrder: (vehicleId?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentOrders,
  vehicles,
  onSelectVehicle,
  onNavigateToTab,
  onOpenNewOrder,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isBlankState = (stats?.totalVehicles || 0) === 0;

  return (
    <div className="space-y-6">
      {/* Blank Database Setup Onboarding Banner */}
      {isBlankState && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 border-2 border-dashed border-amber-300 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Sistema Limpio & Listo para tu Negocio
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                La base de datos está en blanco y preparada para tu taller
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Se eliminaron todos los datos de demostración anteriores. Tu sistema cuenta con la estructura completa
                (hoja de vida, órdenes de trabajo, inventario, alertas preventivas y auditoría) esperando la información real de tus motos y clientes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateToTab('vehicles')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Registrar Primera Moto
              </button>
              <button
                onClick={() => onNavigateToTab('inventory')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                <Package className="w-4 h-4 text-amber-500" />
                Cargar Repuestos
              </button>
              <button
                onClick={() => onNavigateToTab('plans')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                <CalendarClock className="w-4 h-4 text-amber-400" />
                Planes Preventivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Taller de Reparaciones & Mantenimiento
          </span>
          <h2 className="text-2xl font-bold mt-2 text-white">Centro de Control de Servicios & Bahías</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Trazabilidad de motocicletas de clientes, alertas preventivas, órdenes de trabajo mecánicas y consumo de repuestos en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('vehicles')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all border border-slate-600"
          >
            Ver Catálogo de Motos
          </button>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            Ver Órdenes ({stats?.pendingOrders || 0})
          </button>
        </div>
      </div>


      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Motos Activas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Motos en Operación</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats?.activeVehicles || 0}</span>
              <span className="text-xs text-slate-400">/ {stats?.totalVehicles || 0} registradas</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats?.maintenanceVehicles || 0} en taller</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bike className="w-6 h-6" />
          </div>
        </div>

        {/* Órdenes Pendientes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Órdenes de Trabajo</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats?.pendingOrders || 0}</span>
              <span className="text-xs text-amber-600 font-medium">pendientes</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{stats?.inProgressOrders || 0} en ejecución técnica</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Repuestos en Alerta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Inventario Crítico</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold ${(stats?.lowStockParts || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {stats?.lowStockParts || 0}
              </span>
              <span className="text-xs text-slate-400">ítems bajo stock</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Reposición requerida</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Costo Acumulado */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Facturación & Costos Taller</p>
            <div className="mt-1">
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(stats?.totalFleetCost || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Mantenimiento + Insumos</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Preventive Alerts & Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Preventive Maintenance Traffic-Light Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Alertas Preventivas por Kilometraje y Tiempo</h3>
                <p className="text-xs text-slate-500">Motos con mantenimientos vencidos o próximos al límite</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('plans')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Ver Matriz Completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.alerts && stats.alerts.length > 0 ? (
            <div className="space-y-3">
              {stats.alerts.map((alert, idx) => {
                const isRed = alert.urgency === 'red';
                const isOrange = alert.urgency === 'orange';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isRed
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : isOrange
                        ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                          isRed
                            ? 'bg-red-600 ring-4 ring-red-200 animate-pulse'
                            : isOrange
                            ? 'bg-orange-500 ring-4 ring-orange-200'
                            : 'bg-amber-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                            {alert.plate}
                          </span>
                          <span className="font-semibold text-sm">
                            {alert.brand} {alert.model}
                          </span>
                          <span
                            className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isRed
                                ? 'bg-red-600 text-white'
                                : isOrange
                                ? 'bg-orange-600 text-white'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {isRed ? 'Vencido' : isOrange ? 'Crítico' : 'Próximo'}
                          </span>
                        </div>
                        <p className="text-xs font-medium mt-1">
                          Plan: <span className="underline font-semibold">{alert.title}</span> — {alert.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onSelectVehicle(alert.vehicleId)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs"
                      >
                        Hoja de Vida
                      </button>
                      <button
                        onClick={() => onOpenNewOrder(alert.vehicleId)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-2xs"
                      >
                        Crear Orden
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-800 font-semibold text-sm">Todas las motos están al día</p>
              <p className="text-xs text-slate-500 mt-0.5">
                No hay alertas de mantenimiento preventivo vencidas en este momento.
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Active Work Orders in Workshop */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                Órdenes en Taller
              </h3>
              <button
                onClick={() => onNavigateToTab('orders')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'cancelled'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status === 'in_progress'
                          ? 'En Proceso'
                          : order.status === 'completed'
                          ? 'Finalizada'
                          : order.status === 'cancelled'
                          ? 'Cancelada'
                          : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-1">{order.description}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                      <span>Placa: <strong className="text-slate-700">{order.vehicle?.plate || 'N/A'}</strong></span>
                      <span>Téc: {order.technicianName || 'Por asignar'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No hay órdenes registradas.</p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onOpenNewOrder()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              Nueva Orden de Trabajo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
