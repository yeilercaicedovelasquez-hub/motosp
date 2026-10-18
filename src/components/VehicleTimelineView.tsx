import React, { useState, useEffect } from 'react';
import {
  Vehicle,
  VehicleTimelineEvent,
  TimelineEventType,
  EventCategory,
  AttachmentFile,
} from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bike,
  Plus,
  Calendar,
  Gauge,
  DollarSign,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Shield,
  FileCheck,
  Zap,
  Disc,
  Filter,
  X,
  Eye,
  Download,
  Upload,
  User,
  ExternalLink,
} from 'lucide-react';

interface VehicleTimelineViewProps {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  onSelectVehicleId: (id: number) => void;
  onRefresh: () => void;
  onNavigateToVehicles?: () => void;
}

export const VehicleTimelineView: React.FC<VehicleTimelineViewProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicleId,
  onRefresh,
  onNavigateToVehicles,
}) => {
  const { canCreateOrder } = useAuth();
  const [timeline, setTimeline] = useState<VehicleTimelineEvent[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentFile | null>(null);

  // Default to first vehicle if none selected
  const activeVehicleId = selectedVehicleId || vehicles[0]?.id || null;

  // New Event Form
  const [newEvent, setNewEvent] = useState({
    eventType: 'preventive' as TimelineEventType,
    title: '',
    description: '',
    mileage: 0,
    eventDate: new Date().toISOString().split('T')[0],
    costTotal: '',
    performedBy: '',
    category: 'oil' as EventCategory,
    attachments: [] as AttachmentFile[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputName, setFileInputName] = useState('');
  const [fileInputUrl, setFileInputUrl] = useState('');

  // Fetch timeline data whenever active vehicle changes
  useEffect(() => {
    if (!activeVehicleId) return;

    const currentV = vehicles.find((v) => v.id === activeVehicleId);
    if (currentV) {
      setVehicle(currentV);
      setNewEvent((prev) => ({
        ...prev,
        mileage: currentV.currentMileage,
      }));
    }

    setIsLoading(true);
    fetch(`/api/vehicles/${activeVehicleId}/timeline`)
      .then((res) => res.json())
      .then((data) => {
        setTimeline(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error timeline:', err))
      .finally(() => setIsLoading(false));
  }, [activeVehicleId, vehicles]);

  // Add attachment helper
  const handleAddAttachment = () => {
    if (!fileInputName.trim() || !fileInputUrl.trim()) return;
    setNewEvent((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          name: fileInputName.trim(),
          url: fileInputUrl.trim(),
          type: fileInputUrl.includes('.pdf') ? 'application/pdf' : 'image/jpeg',
          size: '1.0 MB',
        },
      ],
    }));
    setFileInputName('');
    setFileInputUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setNewEvent((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            name: file.name,
            url: base64Url,
            type: file.type || 'image/jpeg',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: newEvent.eventType,
          title: newEvent.title,
          description: newEvent.description,
          mileage: Number(newEvent.mileage),
          eventDate: newEvent.eventDate,
          costTotal: newEvent.costTotal ? String(newEvent.costTotal) : '0',
          performedBy: newEvent.performedBy || 'Taller Interno',
          category: newEvent.category,
          attachmentsJson: JSON.stringify(newEvent.attachments),
        }),
      });

      if (!res.ok) throw new Error('Error al registrar evento');

      setIsAddEventOpen(false);
      setNewEvent({
        eventType: 'preventive',
        title: '',
        description: '',
        mileage: vehicle.currentMileage,
        eventDate: new Date().toISOString().split('T')[0],
        costTotal: '',
        performedBy: '',
        category: 'oil',
        attachments: [],
      });

      // Refresh data
      onRefresh();
      // Refetch current timeline
      const freshTimeline = await fetch(`/api/vehicles/${vehicle.id}/timeline`).then((r) => r.json());
      setTimeline(freshTimeline);
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

  // Helper icons for categories
  const getCategoryIcon = (cat?: EventCategory, type?: TimelineEventType) => {
    switch (cat) {
      case 'oil':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'brakes':
        return <Disc className="w-4 h-4 text-red-500" />;
      case 'tires':
        return <Gauge className="w-4 h-4 text-slate-700" />;
      case 'battery':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'paperwork':
        return <FileCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Wrench className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getEventBadge = (type: TimelineEventType) => {
    switch (type) {
      case 'preventive':
        return { label: 'Preventivo', bg: 'bg-emerald-100 text-emerald-800' };
      case 'corrective':
        return { label: 'Correctivo', bg: 'bg-amber-100 text-amber-800' };
      case 'repair':
        return { label: 'Reparación', bg: 'bg-orange-100 text-orange-800' };
      case 'insurance':
        return { label: 'Seguro SOAT', bg: 'bg-blue-100 text-blue-800' };
      case 'inspection':
        return { label: 'Tecnomecánica', bg: 'bg-indigo-100 text-indigo-800' };
      case 'accident':
        return { label: 'Siniestro / Accidente', bg: 'bg-red-100 text-red-800' };
      case 'part_replacement':
        return { label: 'Cambio de Repuesto', bg: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Historial', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  const filteredTimeline = timeline.filter((t) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'preventive') return t.eventType === 'preventive';
    if (categoryFilter === 'corrective') return t.eventType === 'corrective' || t.eventType === 'repair';
    if (categoryFilter === 'documents') return t.eventType === 'insurance' || t.eventType === 'inspection' || t.eventType === 'tax';
    if (categoryFilter === 'parts') return t.eventType === 'part_replacement';
    return true;
  });

  const totalSpent = timeline.reduce((acc, curr) => acc + (Number(curr.costTotal) || 0), 0);

  if (!vehicle) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No hay motocicletas registradas</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Registra tu primera moto en el catálogo para ver su hoja de vida completa, intervenciones mecánicas y trazabilidad.
        </p>
        {onNavigateToVehicles && (
          <button
            onClick={onNavigateToVehicles}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Bike className="w-4 h-4" />
            <span>Ir al Catálogo para Registrar Moto</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Motocicleta Seleccionada:
          </label>
          <select
            value={activeVehicleId}
            onChange={(e) => onSelectVehicleId(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.brand} {v.model} ({v.currentMileage.toLocaleString()} km)
              </option>
            ))}
          </select>
        </div>

        {canCreateOrder && (
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Evento / Mantenimiento</span>
          </button>
        )}
      </div>

      {/* Vehicle Summary Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              {vehicle.photoUrl ? (
                <img src={vehicle.photoUrl} alt={vehicle.plate} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Bike className="w-8 h-8" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xl px-3 py-0.5 rounded-lg bg-slate-900 text-amber-400 tracking-wider">
                  {vehicle.plate}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    vehicle.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : vehicle.status === 'maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {vehicle.status === 'active' ? 'Activa' : vehicle.status === 'maintenance' ? 'En Taller' : 'Inactiva'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="text-xs text-slate-500">
                Modelo {vehicle.year} • {vehicle.displacementCc} cc • {vehicle.color || 'Sin color'} • Motor:{' '}
                {vehicle.engineNumber || 'N/D'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Odómetro Actual</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {vehicle.currentMileage.toLocaleString('es-CO')} <span className="text-xs font-normal">km</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Inversión Total</span>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(totalSpent)}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-medium">Eventos Hoja de Vida</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{timeline.length} registros</p>
            </div>
          </div>
        </div>

        {/* Owner & Contact Details Strip */}
        <div className="bg-slate-50 px-6 py-3 text-xs text-slate-600 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <strong className="text-slate-800">Propietario / Cliente:</strong>{' '}
            {vehicle.ownerName || vehicle.driverName || 'Cliente Particular'}
          </div>
          {vehicle.driverPhone && (
            <div>
              <strong className="text-slate-800">Teléfono / WhatsApp:</strong> {vehicle.driverPhone}
            </div>
          )}
          {vehicle.companyName && (
            <div>
              <strong className="text-slate-800">Convenio / Empresa:</strong> {vehicle.companyName}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Línea de Tiempo de Mantenimiento</h3>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              categoryFilter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({timeline.length})
          </button>
          <button
            onClick={() => setCategoryFilter('preventive')}
            className={`px-3 py-1 rounded-md transition-colors ${
              categoryFilter === 'preventive' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preventivos
          </button>
          <button
            onClick={() => setCategoryFilter('corrective')}
            className={`px-3 py-1 rounded-md transition-colors ${
              categoryFilter === 'corrective' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Correctivos
          </button>
          <button
            onClick={() => setCategoryFilter('parts')}
            className={`px-3 py-1 rounded-md transition-colors ${
              categoryFilter === 'parts' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Repuestos
          </button>
          <button
            onClick={() => setCategoryFilter('documents')}
            className={`px-3 py-1 rounded-md transition-colors ${
              categoryFilter === 'documents' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documentos
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filteredTimeline.length > 0 ? (
          filteredTimeline.map((event) => {
            const badge = getEventBadge(event.eventType);
            let attachments: AttachmentFile[] = [];
            try {
              attachments = event.attachmentsJson ? JSON.parse(event.attachmentsJson) : [];
            } catch (e) {
              attachments = [];
            }

            return (
              <div key={event.id} className="relative group">
                {/* Node Bullet */}
                <div className="absolute -left-6 sm:-left-8 top-3 w-6 h-6 rounded-full bg-white border-2 border-amber-500 shadow-xs flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          {event.mileage.toLocaleString('es-CO')} km
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {event.eventDate}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 mt-2">{event.title}</h4>
                    </div>

                    {/* Cost Total */}
                    {Number(event.costTotal) > 0 && (
                      <div className="text-right self-start">
                        <span className="text-xs text-slate-400">Costo servicio:</span>
                        <p className="font-bold text-base text-slate-900">{formatCurrency(event.costTotal)}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{event.description}</p>
                  )}

                  {/* Performed by & attachments */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      <span>Responsable: <strong className="text-slate-700">{event.performedBy || 'Taller Autorizado'}</strong></span>
                    </div>

                    {/* Attachments Badges */}
                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {attachments.length} archivo(s):
                        </span>
                        {attachments.map((att, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedAttachment(att)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span className="max-w-[120px] truncate">{att.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No hay registros para los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Modal: Add New Event to Timeline */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Registrar Evento en Hoja de Vida ({vehicle.plate})
                </h3>
              </div>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="mt-4 space-y-4">
              {/* Row 1: Tipo de Evento y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Evento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as TimelineEventType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="preventive">Mantenimiento Preventivo</option>
                    <option value="corrective">Mantenimiento Correctivo</option>
                    <option value="repair">Reparación Mecánica</option>
                    <option value="part_replacement">Cambio de Repuesto Específico</option>
                    <option value="insurance">Seguro SOAT / Póliza</option>
                    <option value="inspection">Revisión Técnico-Mecánica</option>
                    <option value="tax">Impuestos / Matrícula</option>
                    <option value="accident">Siniestro / Accidente</option>
                    <option value="other">Otro Registro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Componente / Categoría
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as EventCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="oil">Aceite de Motor y Filtro</option>
                    <option value="brakes">Frenos (Pastillas / Líquido)</option>
                    <option value="tires">Llantas / Neumáticos</option>
                    <option value="chain_kit">Kit de Arrastre (Cadena / Piñones)</option>
                    <option value="battery">Batería y Sistema Eléctrico</option>
                    <option value="filters">Filtros (Aire / Gasolina)</option>
                    <option value="spark_plugs">Bujías</option>
                    <option value="paperwork">Documentación / Trámites</option>
                    <option value="general">Mantenimiento General</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de Aceite 15.000 km y Pastillas Delanteras"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Row 3: Kilometraje, Fecha, Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kilometraje (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newEvent.mileage}
                    onChange={(e) => setNewEvent({ ...newEvent, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Total ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 145000"
                    value={newEvent.costTotal}
                    onChange={(e) => setNewEvent({ ...newEvent, costTotal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taller o Técnico Responsable
                </label>
                <input
                  type="text"
                  placeholder="Ej. Técnico Roberto Gómez / Sede Central"
                  value={newEvent.performedBy}
                  onChange={(e) => setNewEvent({ ...newEvent, performedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detalles y Observaciones Técnicas
                </label>
                <textarea
                  rows={3}
                  placeholder="Describa el trabajo realizado, repuestos cambiados, marcas utilizadas o diagnóstico..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Soportes y Archivos Adjuntos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-xs font-semibold text-slate-700">
                  Adjuntar Facturas, Fotos y Soportes
                </span>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs text-slate-600 transition-colors">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>Subir archivo desde equipo (foto/PDF)</span>
                    <input type="file" onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                  </label>
                </div>

                {/* Or via URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nombre del archivo (ej. factura_soat.pdf)"
                    value={fileInputName}
                    onChange={(e) => setFileInputName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="URL del archivo"
                    value={fileInputUrl}
                    onChange={(e) => setFileInputUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
                  >
                    + Agregar
                  </button>
                </div>

                {/* List of attached files */}
                {newEvent.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {newEvent.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate font-medium">{att.name}</span>
                          <span className="text-[10px] text-slate-400">({att.size || '1MB'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewEvent((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar en Hoja de Vida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Attachment */}
      {selectedAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 truncate">{selectedAttachment.name}</h4>
              </div>
              <button
                onClick={() => setSelectedAttachment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              {selectedAttachment.type.includes('image') ||
              selectedAttachment.url.startsWith('data:image') ||
              selectedAttachment.url.includes('images.unsplash') ? (
                <img
                  src={selectedAttachment.url}
                  alt={selectedAttachment.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="py-12 text-center">
                  <FileCheck className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800 text-sm">{selectedAttachment.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Documento PDF / Archivo digital adjunto</p>
                  <a
                    href={selectedAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir archivo en nueva pestaña
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAttachment(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
