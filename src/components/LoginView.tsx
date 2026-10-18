import React, { useState } from 'react';
import {
  useAuth,
  WORKSHOP_EMPLOYEES,
  ROLE_LIMITATIONS,
  WorkshopEmployee,
} from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Bike,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const {
    loginWithPin,
    loginWithCustomAdmin,
    signInWithGoogle,
    allEmployees,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'staff' | 'register' | 'google'>('staff');
  
  // Staff PIN login state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    allEmployees[0]?.id || WORKSHOP_EMPLOYEES[0].id
  );
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Admin / Business registration state
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerRole, setOwnerRole] = useState<UserRole>('admin');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Find currently selected employee
  const currentSelectedEmp =
    allEmployees.find((e) => e.id === selectedEmployeeId) || allEmployees[0] || WORKSHOP_EMPLOYEES[0];

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!pin) {
      setLoginError('Por favor ingresa tu código PIN de seguridad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithPin(selectedEmployeeId, pin);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setLoginError(res.error || 'PIN incorrecto. Verifica el código e intenta nuevamente.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!ownerName.trim()) {
      setLoginError('Por favor ingresa tu nombre o el del encargado.');
      return;
    }
    if (!ownerPin || ownerPin.length < 4) {
      setLoginError('El PIN de seguridad debe contener al menos 4 dígitos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalEmail =
        ownerEmail.trim() ||
        `${ownerName.toLowerCase().replace(/\s+/g, '.')}@${
          businessName ? businessName.toLowerCase().replace(/\s+/g, '') + '.com' : 'taller.com'
        }`;

      const res = await loginWithCustomAdmin(
        ownerName.trim(),
        finalEmail,
        ownerPin,
        ownerRole,
        businessName.trim() || undefined
      );

      if (res.success) {
        setRegisterSuccess(true);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 300);
      } else {
        setLoginError(res.error || 'Error al registrar administrador.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al procesar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'No fue posible iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 select-none">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header / Brand */}
        <div className="p-6 pb-5 border-b border-slate-800 text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25 mb-3 text-slate-950 font-black">
            <Bike className="w-8 h-8 text-slate-950" />
          </div>

          <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>MotoGestión</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold">
              PRO
            </span>
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Portal de Acceso Seguro al Taller de Motos
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 font-mono text-emerald-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              Sesión Protegida RBAC
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 text-slate-400">
              <Lock className="w-3 h-3 text-amber-400" />
              Cifrado SSL
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 bg-slate-950/60 border-b border-slate-800 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setLoginError(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Acceso PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLoginError(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mi Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setLoginError(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Google SSO</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Error Message Display */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* TAB 1: STAFF PIN LOGIN */}
          {activeTab === 'staff' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selecciona tu Usuario de Personal:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {allEmployees.map((emp) => {
                    const isSelected = selectedEmployeeId === emp.id;
                    const roleInfo = ROLE_LIMITATIONS[emp.role];

                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                            : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg ${emp.avatarColor} flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {emp.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{emp.title}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${roleInfo.badgeClass}`}
                        >
                          {emp.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected User Summary Badge */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">Usuario seleccionado:</span>
                <span className="font-semibold text-amber-400">
                  {currentSelectedEmp.name} ({currentSelectedEmp.role})
                </span>
              </div>

              {/* Security PIN Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN de Acceso al Taller</span>
                  </label>
                  <span className="text-[10px] text-amber-400/90 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                    PIN por defecto: 1234
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={10}
                    placeholder="Introduce tu PIN (ej: 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPin('1234');
                  }}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 underline underline-offset-2"
                >
                  Autocompletar PIN predeterminado (1234)
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER / CONFIGURE MY BUSINESS */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Personaliza tu Negocio:</strong> Ingresa tus datos para quedar configurado como Administrador principal de tu taller en blanco.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Taller o Negocio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. Taller MotoSpeed Pro"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Building2 className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tu Nombre Completo (Propietario / Encargado) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Carlos Pérez"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="admin@mitaller.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Crea tu PIN de Acceso <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    placeholder="4 a 6 dígitos"
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rol en el Sistema
                  </label>
                  <select
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="supervisor">Recepción / Asesor</option>
                    <option value="technician">Técnico Mecánico</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Guardando y autenticando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Guardar y Entrar como Administrador</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: GOOGLE SSO */}
          {activeTab === 'google' && (
            <div className="space-y-4 py-2 text-center">
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Inicia sesión de forma directa y vinculada con tu cuenta de Google. Tu identidad quedará registrada para trazabilidad y auditoría en cada servicio y orden creada en el taller.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Compatible con Google Workspace y cuentas Gmail corporativas.
              </p>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>Acceso restringido para personal autorizado del taller mecánico.</span>
        </div>
      </div>
    </div>
  );
};
