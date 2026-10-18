import React from 'react';
import {
  LayoutDashboard,
  Bike,
  FileText,
  Wrench,
  CalendarClock,
  Package,
  BarChart3,
  ShieldCheck,
  Building2,
  X,
  User,
  Shield,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth, ROLE_LIMITATIONS } from '../context/AuthContext.tsx';

export type TabType =
  | 'dashboard'
  | 'vehicles'
  | 'timeline'
  | 'orders'
  | 'plans'
  | 'inventory'
  | 'reports'
  | 'audit';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  onClose?: () => void;
  pendingOrdersCount?: number;
  urgentAlertsCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onClose,
  pendingOrdersCount = 0,
  urgentAlertsCount = 0,
  lowStockCount = 0,
}) => {
  const { activeEmployee, setIsLoginModalOpen, role, signOut } = useAuth();

  const menuItems: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'vehicles',
      label: 'Motos & Clientes',
      icon: <Bike className="w-5 h-5" />,
    },
    {
      id: 'timeline',
      label: 'Hoja de Vida',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Órdenes de Trabajo',
      icon: <Wrench className="w-5 h-5" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'plans',
      label: 'Planes y Alertas',
      icon: <CalendarClock className="w-5 h-5" />,
    },
    {
      id: 'inventory',
      label: 'Inventario Almacén',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'reports',
      label: 'Costos y Rentabilidad',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'audit',
      label: 'Personal & Auditoría',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black">
            <Bike className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              MotoGestión <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">TALLER</span>
            </h1>
            <p className="text-[11px] text-slate-400">Reparaciones & Servicios</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors md:hidden"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Módulos del Taller</p>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Employee Role Card (Clickable to switch role) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div
          onClick={() => {
            setIsLoginModalOpen(true);
            if (onClose) onClose();
          }}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all group"
          title="Haz clic para cambiar de empleado o ver limitaciones de tu rol"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Empleado en Turno
            </span>
            <span
              className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${ROLE_LIMITATIONS[role].badgeClass}`}
            >
              {role}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <div
              className={`w-7 h-7 rounded-lg ${activeEmployee.avatarColor} flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}
            >
              {activeEmployee.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                {activeEmployee.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{activeEmployee.title}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
          </div>

          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-amber-400 font-medium">
            <span>Cambiar Rol / Limitaciones</span>
            <Shield className="w-3 h-3" />
          </div>
        </div>

        {/* Lock / Logout option */}
        <button
          onClick={signOut}
          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Bloquear pantalla y cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
