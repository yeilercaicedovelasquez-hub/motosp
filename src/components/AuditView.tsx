import React, { useState, useEffect } from 'react';
import { AuditLog, UserProfile, UserRole } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  History,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  Search,
} from 'lucide-react';

export const AuditView: React.FC = () => {
  const { role, canManageUsers } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    fetchLogsAndUsers();
  }, []);

  const fetchLogsAndUsers = async () => {
    setIsLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        fetch('/api/audit-logs').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);

      setLogs(Array.isArray(logsRes) ? logsRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Error al actualizar rol');
      fetchLogsAndUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const term = logSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.entityType && l.entityType.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Control de Acceso (RBAC) y Auditoría</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Trazabilidad completa de operaciones en base de datos y matriz de permisos por perfil
        </p>
      </div>

      {/* RBAC Matrix Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          Matriz de Roles y Permisos del Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Admin */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-purple-900">Administrador</span>
                <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded">
                  ACCESO TOTAL
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Crear, editar y eliminar motos
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Aprobar y cerrar órdenes de trabajo
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Control de stock y compras
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Ver costos, métricas y auditoría
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-purple-700 mt-3 font-medium">Control de configuración general</p>
          </div>

          {/* Supervisor */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-blue-900">Supervisor Flota</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">
                  OPERACIONES
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Gestión completa de motocicletas
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Programación de mantenimientos
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Recepción y asignación en taller
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Reportes e indicadores de costos
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-blue-700 mt-3 font-medium">Gestión diaria del taller de motos</p>
          </div>

          {/* Técnico */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-900">Técnico Mecánico</span>
                <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">
                  TALLER
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Ejecución de órdenes de trabajo
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Registro de repuestos instalados
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Evidencias de fotos antes / después
                </li>
                <li className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Sin acceso a finanzas globales
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-amber-700 mt-3 font-medium">Operación técnica de mantenimiento</p>
          </div>

          {/* Consultor */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900">Consultor / Auditor</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  SOLO LECTURA
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Consulta de hoja de vida de motos
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Consulta de reportes financieros
                </li>
                <li className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Sin permisos de modificación
                </li>
                <li className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Sin permisos de borrado
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-emerald-700 mt-3 font-medium">Auditoría externa y consulta de clientes</p>
          </div>
        </div>
      </div>

      {/* Audit Logs Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              Registro de Auditoría y Trazabilidad (Últimos Eventos)
            </h3>
            <p className="text-[11px] text-slate-500">
              Registrado automáticamente en PostgreSQL para cada creación, cambio de estado y ajuste
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en auditoría..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-4">Fecha y Hora</th>
                <th className="py-2.5 px-4">Usuario</th>
                <th className="py-2.5 px-4">Acción</th>
                <th className="py-2.5 px-4">Módulo</th>
                <th className="py-2.5 px-4">Detalle de la Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es-CO')}
                  </td>

                  <td className="py-2.5 px-4 font-semibold text-slate-800 font-sans">
                    {log.userName || log.userId}
                  </td>

                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'UPDATE' || log.action === 'STATUS_CHANGE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'DELETE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-slate-600 font-sans font-medium capitalize">
                    {log.entityType.replace('_', ' ')}
                  </td>

                  <td className="py-2.5 px-4 font-sans text-slate-800 max-w-md truncate" title={log.details || ''}>
                    {log.details || 'Operación registrada en base de datos'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
