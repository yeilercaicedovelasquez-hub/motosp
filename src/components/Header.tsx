import React from 'react';
import { useAuth, ROLE_LIMITATIONS } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  Plus,
  Shield,
  User,
  LogIn,
  LogOut,
  RefreshCw,
  Wrench,
  Bike,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewVehicle: () => void;
  onOpenNewOrder: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewVehicle,
  onOpenNewOrder,
  onRefresh,
  isRefreshing = false,
  isMobileMenuOpen,
  onToggleMobileMenu,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
}) => {
  const {
    user,
    role,
    activeEmployee,
    setIsLoginModalOpen,
    signOut,
    canEditVehicle,
    canCreateOrder,
  } = useAuth();

  const currentRoleInfo = ROLE_LIMITATIONS[role];

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Single Toggle Button + Title */}
      <div className="flex items-center space-x-3">
        {/* Single Button to Hide / Show Menu */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              onToggleMobileMenu();
            } else if (onToggleDesktopSidebar) {
              onToggleDesktopSidebar();
            }
          }}
          aria-label={isDesktopSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          title={isDesktopSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-center cursor-pointer"
        >
          {/* Mobile view icon */}
          <span className="md:hidden flex items-center">
            {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-600" /> : <Menu className="w-5 h-5" />}
          </span>

          {/* Desktop view icon */}
          <span className="hidden md:flex items-center">
            {isDesktopSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-slate-600 hover:text-slate-900" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-amber-600 hover:text-amber-700" />
            )}
          </span>
        </button>

        {/* Title */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-900 font-bold text-sm lg:text-base">Taller de Motos</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Gestor de Mantenimiento
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Selector Button, Quick Actions, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Actualizar datos del taller"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Role & Employee Selector Button (Opens EmployeeLoginModal) */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors text-left"
          title="Cambiar empleado o consultar limitaciones de tu rol"
        >
          <div
            className={`w-6 h-6 rounded-lg ${activeEmployee.avatarColor} flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}
          >
            {activeEmployee.name[0]}
          </div>

          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                {activeEmployee.name.split(' ')[0]}
              </span>
              <span
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${currentRoleInfo.badgeClass}`}
              >
                {role}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate max-w-[130px]">
              {activeEmployee.title}
            </p>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Lock / Sign Out Button */}
        <button
          onClick={signOut}
          title="Bloquear pantalla / Cerrar sesión"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Quick Action: New Motorcycle (only if authorized) */}
        {canEditVehicle && (
          <button
            onClick={onOpenNewVehicle}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Registrar ingreso de una motocicleta al taller"
          >
            <Bike className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">+ Ingreso Moto</span>
          </button>
        )}

        {/* Quick Action: New Work Order */}
        {canCreateOrder && (
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Crear nueva orden de trabajo"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden md:inline">+ Orden</span>
          </button>
        )}
      </div>
    </header>
  );
};
