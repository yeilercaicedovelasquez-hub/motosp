import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleStatus, VehicleType, Branch } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bike,
  Plus,
  Search,
  Filter,
  FileText,
  Edit2,
  Trash2,
  User,
  Phone,
  Gauge,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Wrench,
  Fuel,
  ShieldAlert,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  branches: Branch[];
  onSelectVehicle: (id: number) => void;
  onRefresh: () => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (val: boolean) => void;
  onOpenNewOrder?: (vehicleId: number) => void;
}

const COMMON_BRANDS = ['Yamaha', 'Honda', 'Bajaj', 'Suzuki', 'AKT', 'KTM', 'TVS', 'Hero', 'Kymco'];

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  branches,
  onSelectVehicle,
  onRefresh,
  isCreateOpen,
  setIsCreateOpen,
  onOpenNewOrder,
}) => {
  const { canEditVehicle, canDeleteVehicle, role, activeEmployee } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State for Taller de Reparaciones
  const initialFormState = {
    plate: '',
    brand: 'Yamaha',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    engineNumber: '',
    vin: '',
    vehicleType: 'motorcycle' as VehicleType,
    displacementCc: 150,
    currentMileage: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'active' as VehicleStatus,
    photoUrl: '',
    notes: '',
    branchId: branches[0]?.id || 1,
    ownerName: '',
    driverPhone: '',
    driverName: '',
    companyName: '',
    // Workshop specific reception metadata
    entryReason: '',
    fuelLevel: '1/2',
    intakeChecklist: {
      helmet: false,
      mirrors: true,
      papers: true,
      tools: false,
      topBox: false,
    },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form when opening create mode
  useEffect(() => {
    if (isCreateOpen && !editingVehicle) {
      setFormData({
        ...initialFormState,
        branchId: branches[0]?.id || 1,
      });
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isCreateOpen]);

  // Open modal for edit
  const handleEdit = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVehicle(v);

    // Parse potential reception details from notes
    let parsedNotes = v.notes || '';
    let entryReason = '';
    let fuelLevel = '1/2';

    if (parsedNotes.includes('MOTIVO:')) {
      const parts = parsedNotes.split(' | ');
      for (const p of parts) {
        if (p.startsWith('MOTIVO:')) entryReason = p.replace('MOTIVO:', '').trim();
        if (p.startsWith('GASOLINA:')) fuelLevel = p.replace('GASOLINA:', '').trim();
      }
    }

    setFormData({
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color || '',
      engineNumber: v.engineNumber || '',
      vin: v.vin || '',
      vehicleType: v.vehicleType || 'motorcycle',
      displacementCc: v.displacementCc || 150,
      currentMileage: v.currentMileage,
      purchaseDate: v.purchaseDate || '',
      status: v.status,
      photoUrl: v.photoUrl || '',
      notes: v.notes || '',
      branchId: v.branchId || branches[0]?.id || 1,
      ownerName: v.ownerName || '',
      driverPhone: v.driverPhone || '',
      driverName: v.driverName || '',
      companyName: v.companyName || '',
      entryReason: entryReason || '',
      fuelLevel: fuelLevel || '1/2',
      intakeChecklist: {
        helmet: false,
        mirrors: true,
        papers: true,
        tools: false,
        topBox: false,
      },
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsCreateOpen(true);
  };

  // Delete vehicle
  const handleDelete = async (id: number, plate: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDeleteVehicle) {
      alert('Solo el Administrador / Jefe de Taller tiene permisos para eliminar motocicletas del registro.');
      return;
    }

    if (
      !confirm(
        `¿Confirmas la eliminación permanente de la moto ${plate}? Esta acción eliminará también su historial de mantenimientos y órdenes de servicio.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al eliminar motocicleta');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    const cleanPlate = formData.plate.toUpperCase().trim();
    if (!cleanPlate) {
      setErrorMsg('La placa de la motocicleta es obligatoria.');
      return;
    }

    if (!formData.ownerName.trim()) {
      setErrorMsg('El nombre completo del propietario (cliente) es obligatorio para el taller.');
      return;
    }

    if (!formData.brand.trim() || !formData.model.trim()) {
      setErrorMsg('Debes especificar la marca y el modelo de la moto.');
      return;
    }

    // Check duplicate plate client-side when creating
    if (!editingVehicle) {
      const alreadyExists = vehicles.some(
        (v) => v.plate.toUpperCase().trim() === cleanPlate
      );
      if (alreadyExists) {
        setErrorMsg(
          `La motocicleta con placa ${cleanPlate} ya está registrada en el taller. Búscala en el listado para abrirle una orden o consultar su historial.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    // Build structured notes with reception info
    let combinedNotes = formData.notes.trim();
    if (formData.entryReason.trim() || formData.fuelLevel) {
      const receptionMetadata = `[RECEPCIÓN TALLER] MOTIVO: ${formData.entryReason.trim() || 'Mantenimiento General'} | GASOLINA: ${formData.fuelLevel} | CLIENTE: ${formData.ownerName.trim()}`;
      combinedNotes = combinedNotes ? `${receptionMetadata}\n${combinedNotes}` : receptionMetadata;
    }

    const payload = {
      plate: cleanPlate,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: Number(formData.year) || new Date().getFullYear(),
      color: formData.color.trim(),
      engineNumber: formData.engineNumber.trim(),
      vin: formData.vin.trim(),
      vehicleType: formData.vehicleType,
      displacementCc: Number(formData.displacementCc) || 150,
      currentMileage: Number(formData.currentMileage) || 0,
      purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
      status: formData.status,
      photoUrl: formData.photoUrl.trim(),
      notes: combinedNotes,
      branchId: Number(formData.branchId) || 1,
      ownerName: formData.ownerName.trim(),
      driverPhone: formData.driverPhone.trim(),
      driverName: formData.driverName.trim() || formData.ownerName.trim(),
      companyName: formData.companyName.trim(),
    };

    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': activeEmployee.email,
          'x-demo-role': activeEmployee.role,
          'x-demo-name': activeEmployee.name,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Error al guardar motocicleta en el sistema.');
      }

      setSuccessMsg(
        editingVehicle
          ? `Moto ${cleanPlate} actualizada correctamente.`
          : `¡Moto ${cleanPlate} registrada exitosamente en el taller!`
      );

      setTimeout(() => {
        setIsCreateOpen(false);
        setEditingVehicle(null);
        onRefresh();
        if (!editingVehicle && responseData.id) {
          onSelectVehicle(responseData.id);
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      v.plate.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      (v.ownerName && v.ownerName.toLowerCase().includes(term)) ||
      (v.driverPhone && v.driverPhone.toLowerCase().includes(term)) ||
      (v.driverName && v.driverName.toLowerCase().includes(term)) ||
      (v.companyName && v.companyName.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const inShopCount = vehicles.filter((v) => v.status === 'maintenance').length;
  const activeCount = vehicles.filter((v) => v.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header for Workshop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Recepción & Registro de Motocicletas</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold border border-amber-500/20">
              Taller Mecánico
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingreso de motos de clientes, propietarios, odómetro, hoja de vida y órdenes de servicio
          </p>
        </div>

        {canEditVehicle ? (
          <button
            onClick={() => {
              setEditingVehicle(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Ingreso de Moto</span>
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Rol actual: <strong>{activeEmployee.title}</strong> (Solo consulta)
          </div>
        )}
      </div>

      {/* Workshop Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Clientes / Motos</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{vehicles.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Bike className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">En Taller / Reparación</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{inShopCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Entregadas / Listas</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sedes de Atención</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{branches.length || 1}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Fuel className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, propietario / cliente, teléfono, marca o modelo..."
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Todos los Estados</option>
              <option value="maintenance">En Taller / Reparación</option>
              <option value="active">Activa / Entregada</option>
              <option value="inactive">Inactiva / Espera</option>
              <option value="retired">Baja / Desguace</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista en tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron motocicletas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'all'
              ? 'No hay registros que coincidan con los filtros aplicados. Intenta con otra placa o nombre de cliente.'
              : 'Aún no has registrado ninguna moto en el taller. Haz clic en "Registrar Ingreso de Moto" para comenzar.'}
          </p>
          {canEditVehicle && !search && statusFilter === 'all' && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setIsCreateOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Moto</span>
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectVehicle(v.id)}
              className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Plate and Status */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <span className="font-mono font-black text-sm px-2.5 py-1 rounded-md bg-slate-900 text-amber-400 tracking-wider">
                    {v.plate}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      v.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : v.status === 'maintenance'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {v.status === 'active' ? 'Lista / Entregada' : v.status === 'maintenance' ? 'En Taller' : 'Inactiva'}
                  </span>
                </div>

                {/* Make & Model */}
                <div className="mt-3">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                    {v.brand} {v.model}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Año {v.year} • {v.displacementCc} cc • {v.color || 'Color estándar'}
                  </p>
                </div>

                {/* Customer / Owner Info Banner (Primary for Workshop) */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{v.ownerName || 'Cliente Particular'}</span>
                    </div>
                  </div>

                  {v.driverPhone && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{v.driverPhone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${v.driverPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                        title="Enviar WhatsApp al cliente"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        WhatsApp
                      </a>
                    </div>
                  )}

                  {v.companyName && (
                    <p className="text-[10px] text-slate-500 italic">
                      Empresa / Flota: {v.companyName}
                    </p>
                  )}
                </div>

                {/* Mileage & Sede */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900 font-mono">
                      {v.currentMileage.toLocaleString('es-CO')} km
                    </span>
                  </div>
                  {v.notes && (
                    <span className="text-[10px] text-slate-600 max-w-[140px] truncate" title={v.notes}>
                      {v.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onSelectVehicle(v.id)}
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Hoja de Vida</span>
                </button>

                <div className="flex items-center gap-1">
                  {onOpenNewOrder && (
                    <button
                      onClick={() => onOpenNewOrder(v.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Abrir orden de trabajo para esta moto"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  )}
                  {canEditVehicle && (
                    <button
                      onClick={(e) => handleEdit(v, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar datos de la moto y cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDeleteVehicle && (
                    <button
                      onClick={(e) => handleDelete(v.id, v.plate, e)}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredVehicles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Placa</th>
                <th className="py-3 px-4">Motocicleta</th>
                <th className="py-3 px-4">Propietario / Cliente</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Odómetro</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onSelectVehicle(v.id)}
                  className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-xs">
                      {v.plate}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {v.brand} {v.model} ({v.year})
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {v.ownerName || 'Cliente Particular'}
                  </td>
                  <td className="py-3 px-4">{v.driverPhone || 'Sin teléfono'}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {v.currentMileage.toLocaleString('es-CO')} km
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        v.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {v.status === 'active' ? 'Lista / Entregada' : v.status === 'maintenance' ? 'En Taller' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectVehicle(v.id)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                        title="Ver Hoja de Vida"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {canEditVehicle && (
                        <button
                          onClick={(e) => handleEdit(v, e)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteVehicle && (
                        <button
                          onClick={(e) => handleDelete(v.id, v.plate, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Ingreso de Moto al Taller / Edición */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingVehicle ? `Editar Moto ${editingVehicle.plate}` : 'Recepción & Registro de Moto en Taller'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingVehicle
                      ? 'Actualiza los datos del cliente y especificaciones de la moto'
                      : 'Crea la hoja de vida técnica y asocia el cliente propietario'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {/* SECCIÓN 1: DATOS DEL CLIENTE / PROPIETARIO */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>1. Datos del Propietario / Cliente del Taller</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Completo del Propietario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Sebastián Pérez"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono / WhatsApp de Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. +57 312 889 4455"
                      value={formData.driverPhone}
                      onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cédula / Documento del Propietario (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CC 1020304050"
                      value={formData.vin ? '' : ''}
                      onChange={(e) => {}}
                      className="hidden"
                    />
                    <input
                      type="text"
                      placeholder="Ej. C.C. 1.025.889.123 o NIT"
                      value={formData.companyName.startsWith('DOC:') ? formData.companyName.replace('DOC:', '') : ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value ? `DOC:${e.target.value}` : '' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ciudad / Dirección del Cliente (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Calle 45 # 12-30 / Barrio Centro"
                      value={formData.driverName && !formData.driverName.includes(formData.ownerName) ? formData.driverName : ''}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value || formData.ownerName })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DATOS DE LA MOTOCICLETA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Bike className="w-4 h-4 text-slate-500" />
                  <span>2. Especificaciones de la Motocicleta</span>
                </div>

                {/* Placa, Marca, Modelo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Placa de la Moto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. WKM-42F"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase().trim() })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Yamaha"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {/* Quick brand selectors */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COMMON_BRANDS.slice(0, 5).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setFormData({ ...formData, brand: b })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                            formData.brand.toLowerCase() === b.toLowerCase()
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Línea / Modelo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. FZ-25 / Pulsar NS 200"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Año, Cilindraje, Color, Tipo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Año / Modelo</label>
                    <input
                      type="number"
                      min="1990"
                      max="2030"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cilindraje (cc)</label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={formData.displacementCc}
                      onChange={(e) => setFormData({ ...formData, displacementCc: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="Negro / Azul Mate"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="motorcycle">Moto Convencional</option>
                      <option value="scooter">Scooter / Automática</option>
                      <option value="motocarro">Motocarro / Carga</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Kilometraje de Ingreso y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Odómetro al Ingresar (km) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.currentMileage}
                      onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de la Moto</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="maintenance">En Taller / En Reparación</option>
                      <option value="active">Activa / Entregada al Cliente</option>
                      <option value="inactive">Inactiva temporal</option>
                      <option value="retired">Baja / Desguace</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sede del Taller</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RECEPCIÓN Y DIAGNÓSTICO PREVIO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>3. Motivo de Ingreso & Recepción Inicial</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo de Ingreso / Fallas Reportadas por el Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cambio de aceite, sonido metálico al frenar, kit de arrastre desgastado..."
                    value={formData.entryReason}
                    onChange={(e) => setFormData({ ...formData, entryReason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nivel de Combustible al Recibir
                    </label>
                    <select
                      value={formData.fuelLevel}
                      onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Reserva">Reserva</option>
                      <option value="1/4">1/4 de Tanque</option>
                      <option value="1/2">1/2 Tanque</option>
                      <option value="3/4">3/4 de Tanque</option>
                      <option value="Lleno">Tanque Lleno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Foto de la Moto (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observaciones Técnicas Adicionales / Rayones o Golpes Previos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre estado de llantas, golpes en carenaje, accesorios dejados en custodia..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingVehicle ? 'Guardar Cambios' : 'Registrar Moto en Taller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
