import React, { useState } from 'react';
import {
  useAuth,
  ROLE_LIMITATIONS,
  WorkshopEmployee,
} from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  Shield,
  UserCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  UserPlus,
  Briefcase,
  Phone,
  Mail,
  ChevronRight,
  Info,
  LogOut,
} from 'lucide-react';

interface EmployeeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeLoginModal: React.FC<EmployeeLoginModalProps> = ({ isOpen, onClose }) => {
  const { activeEmployee, selectEmployee, role, allEmployees, lockScreen, signOut } = useAuth();
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(role);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('technician');

  if (!isOpen) return null;

  const handleSelectPredefined = (emp: WorkshopEmployee) => {
    selectEmployee(emp);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEmp: WorkshopEmployee = {
      id: 'custom-' + Date.now(),
      name: customName.trim(),
      role: customRole,
      title: ROLE_LIMITATIONS[customRole].title,
      email: customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, '.')}@mototaller.com`,
      avatarColor:
        customRole === 'admin'
          ? 'bg-purple-600 text-white'
          : customRole === 'supervisor'
          ? 'bg-blue-600 text-white'
          : customRole === 'technician'
          ? 'bg-amber-600 text-white'
          : 'bg-emerald-600 text-white',
    };

    selectEmployee(newEmp);
    onClose();
  };

  const activeLimitation = ROLE_LIMITATIONS[selectedRoleTab];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Acceso de Personal & Roles del Taller</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  Seguridad RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecciona tu perfil de empleado para abrir el gestor con tus permisos y restricciones activas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Employee Alert */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Sesión activa actualmente como: <strong>{activeEmployee.name}</strong> ({activeEmployee.title})
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              ROLE_LIMITATIONS[activeEmployee.role].badgeClass
            }`}
          >
            {activeEmployee.role}
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Staff Cards & Custom Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {customMode ? 'Ingreso con Nombre Personalizado' : 'Personal del Taller Registrado'}
              </h4>
              <button
                type="button"
                onClick={() => setCustomMode(!customMode)}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                {customMode ? (
                  <>Ver empleados predefinidos</>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Ingresar con mi nombre
                  </>
                )}
              </button>
            </div>

            {!customMode ? (
              <div className="space-y-2.5">
                {allEmployees.map((emp) => {
                  const isCurrent = activeEmployee.id === emp.id;
                  const roleInfo = ROLE_LIMITATIONS[emp.role];

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedRoleTab(emp.role)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                          : selectedRoleTab === emp.role
                          ? 'border-slate-400 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl ${emp.avatarColor} flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                        >
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium truncate">{emp.title}</p>
                          {emp.specialty && (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {emp.specialty}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.badgeClass}`}
                        >
                          {emp.role.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPredefined(emp);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Entrar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Empleado o Técnico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Sebastián Pérez"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="juan.mecanico@taller.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol y Nivel de Acceso en el Taller
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['admin', 'supervisor', 'technician', 'viewer'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setCustomRole(r);
                          setSelectedRoleTab(r);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          customRole === r
                            ? 'border-amber-500 bg-white shadow-xs ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{ROLE_LIMITATIONS[r].title}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{r}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    Ingresar como {customName || 'Empleado'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Active Role Perms & Limitations (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Matriz de Limitaciones
                </span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span>{activeLimitation.title}</span>
                </h4>
              </div>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${activeLimitation.badgeClass}`}
              >
                {activeLimitation.role}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
              {activeLimitation.summary}
            </p>

            {/* Allowed Capabilities */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Funciones Autorizadas</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {activeLimitation.permissions.map((perm, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted Limitations */}
            <div className="space-y-2 pt-3 border-t border-slate-200 mt-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Limitaciones y Restricciones</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {activeLimitation.limitations.map((lim, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>
              Cada acción realizada en el taller quedará registrada con tu usuario en la auditoría del sistema.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                signOut();
              }}
              className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Cerrar sesión y proteger el taller"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Aceptar y Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
