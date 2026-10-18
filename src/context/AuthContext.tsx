import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { UserRole, UserProfile } from '../types.ts';

export interface WorkshopEmployee {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  email: string;
  phone?: string;
  specialty?: string;
  avatarColor: string;
  pin?: string;
}

export const WORKSHOP_EMPLOYEES: WorkshopEmployee[] = [
  {
    id: 'emp-admin',
    name: 'Carlos Restrepo',
    role: 'admin',
    title: 'Jefe de Taller & Administrador',
    email: 'carlos.jefe@mototaller.com',
    phone: '+57 310 456 7890',
    specialty: 'Gestión General, Costos y Operación',
    avatarColor: 'bg-purple-600 text-white',
    pin: '1234',
  },
  {
    id: 'emp-supervisor',
    name: 'Luisa Fernanda Morales',
    role: 'supervisor',
    title: 'Asesora de Servicio & Recepción',
    email: 'luisa.recepcion@mototaller.com',
    phone: '+57 315 789 1234',
    specialty: 'Recepción de Clientes, Cotizaciones y Entregas',
    avatarColor: 'bg-blue-600 text-white',
    pin: '1234',
  },
  {
    id: 'emp-tech-1',
    name: 'Mateo Gómez',
    role: 'technician',
    title: 'Mecánico Especialista',
    email: 'mateo.mecanico@mototaller.com',
    phone: '+57 301 234 5678',
    specialty: 'Ajuste de Motor, Frenos y Kit de Arrastre',
    avatarColor: 'bg-amber-600 text-white',
    pin: '1234',
  },
  {
    id: 'emp-tech-2',
    name: 'Andrés Salazar',
    role: 'technician',
    title: 'Técnico Electricista & Diagnóstico',
    email: 'andres.diagnostico@mototaller.com',
    phone: '+57 320 890 1234',
    specialty: 'Inyección Electrónica, Baterías y Escaneo',
    avatarColor: 'bg-orange-600 text-white',
    pin: '1234',
  },
  {
    id: 'emp-viewer',
    name: 'Cliente / Auditor Externo',
    role: 'viewer',
    title: 'Consulta de Reparación & Auditoría',
    email: 'auditor@mototaller.com',
    specialty: 'Seguimiento de hoja de vida y facturación',
    avatarColor: 'bg-emerald-600 text-white',
    pin: '1234',
  },
];

export interface RoleLimitationInfo {
  role: UserRole;
  title: string;
  badgeClass: string;
  badgeBg: string;
  summary: string;
  permissions: string[];
  limitations: string[];
}

export const ROLE_LIMITATIONS: Record<UserRole, RoleLimitationInfo> = {
  admin: {
    role: 'admin',
    title: 'Jefe de Taller / Administrador',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeBg: 'bg-purple-500',
    summary: 'Acceso y control total del taller mecánico, inventarios, tarifas y personal.',
    permissions: [
      'Control total: Registrar, editar y eliminar motos del taller',
      'Crear, asignar y finalizar órdenes de trabajo con costos de mano de obra',
      'Gestión de inventario: Alta, baja y ajuste de precios de repuestos',
      'Acceso completo a reportes financieros, gastos y rentabilidad',
      'Administración de roles, usuarios y registro de auditoría',
    ],
    limitations: [
      'Sin restricciones operativas en el sistema',
    ],
  },
  supervisor: {
    role: 'supervisor',
    title: 'Asesor(a) de Servicio / Recepción',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeBg: 'bg-blue-500',
    summary: 'Recepción de clientes, registro de motos en taller, apertura de órdenes y cotizaciones.',
    permissions: [
      'Registrar ingreso de motocicletas y asociar datos del propietario / cliente',
      'Crear y gestionar órdenes de trabajo y cotizaciones',
      'Registrar eventos en la hoja de vida (mantenimientos, revisiones, documentos)',
      'Consultar existencias de repuestos e insumos',
      'Ver costos operativos de las reparaciones',
    ],
    limitations: [
      'No puede eliminar motocicletas ni registros del sistema de forma permanente',
      'No puede modificar costos base de compra en inventario ni eliminar repuestos',
      'No tiene acceso a la configuración de usuarios y auditoría profunda del sistema',
    ],
  },
  technician: {
    role: 'technician',
    title: 'Técnico Mecánico',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeBg: 'bg-amber-500',
    summary: 'Diagnóstico en banco de trabajo, consumo de repuestos de bodega y registro de avances.',
    permissions: [
      'Ver órdenes de trabajo asignadas y detalles técnicos de la moto',
      'Actualizar estado de la orden (En Progreso, Esperando Repuestos, Completada)',
      'Agregar repuestos utilizados desde bodega a la orden de servicio',
      'Cargar fotos de evidencia del estado antes y después de la reparación',
      'Registrar notas técnicas de diagnóstico y resolución del problema',
    ],
    limitations: [
      'No puede registrar motocicletas nuevas ni modificar datos del propietario',
      'No puede eliminar motos ni órdenes de trabajo',
      'No puede modificar precios de venta ni costos base de repuestos',
      'No tiene acceso a reportes financieros de ganancias ni márgenes de utilidad del taller',
    ],
  },
  viewer: {
    role: 'viewer',
    title: 'Cliente / Auditor / Consultor',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeBg: 'bg-emerald-500',
    summary: 'Acceso en modo consulta para verificar el avance de reparación y la hoja de vida.',
    permissions: [
      'Consultar la hoja de vida completa de la motocicleta por placa',
      'Ver el estado de su orden de trabajo y fotos de evidencia',
      'Ver el detalle de repuestos instalados y servicios realizados',
      'Descargar o imprimir resúmenes de mantenimiento',
    ],
    limitations: [
      'Modo solo lectura: No puede crear, editar ni borrar ningún registro',
      'No puede alterar el stock de repuestos ni abrir órdenes de trabajo',
      'No puede ver márgenes de rentabilidad internos del taller',
    ],
  },
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile;
  role: UserRole;
  activeEmployee: WorkshopEmployee;
  allEmployees: WorkshopEmployee[];
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (val: boolean) => void;
  selectEmployee: (employee: WorkshopEmployee) => void;
  setSimulatedRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  loginWithPin: (employeeId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCustomAdmin: (
    name: string,
    email: string,
    pin: string,
    role?: UserRole,
    businessName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  lockScreen: () => void;
  isLoading: boolean;
  canEditVehicle: boolean;
  canDeleteVehicle: boolean;
  canCreateOrder: boolean;
  canDeleteOrder: boolean;
  canManageInventory: boolean;
  canDeletePart: boolean;
  canViewFinancials: boolean;
  canManageUsers: boolean;
}

const STORAGE_ACTIVE_EMPLOYEE = 'mototaller_active_employee_v2';
const STORAGE_CUSTOM_EMPLOYEES = 'mototaller_custom_employees_v2';
const STORAGE_SESSION_AUTH = 'mototaller_auth_session_active_v2';

const loadCustomEmployees = (): WorkshopEmployee[] => {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_EMPLOYEES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading custom employees:', e);
  }
  return [];
};

const getInitialEmployee = (): WorkshopEmployee => {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_EMPLOYEE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading saved employee:', e);
  }
  return WORKSHOP_EMPLOYEES[0];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customEmployees, setCustomEmployees] = useState<WorkshopEmployee[]>(loadCustomEmployees);
  const [activeEmployee, setActiveEmployee] = useState<WorkshopEmployee>(getInitialEmployee);
  const [role, setRole] = useState<UserRole>(activeEmployee.role);
  const [user, setUser] = useState<User | null>(null);

  // Initial authentication state: requires login unless an active authenticated session flag exists
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_SESSION_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile>({
    uid: activeEmployee.id,
    email: activeEmployee.email,
    fullName: activeEmployee.name,
    role: activeEmployee.role,
  });

  // All employees available (default + any custom ones registered)
  const allEmployees: WorkshopEmployee[] = [
    ...customEmployees,
    ...WORKSHOP_EMPLOYEES.filter((we) => !customEmployees.some((ce) => ce.id === we.id)),
  ];

  // Sync role and profile when activeEmployee changes
  useEffect(() => {
    setRole(activeEmployee.role);
    setProfile({
      uid: activeEmployee.id,
      email: activeEmployee.email,
      fullName: activeEmployee.name,
      role: activeEmployee.role,
    });
    try {
      localStorage.setItem(STORAGE_ACTIVE_EMPLOYEE, JSON.stringify(activeEmployee));
    } catch (e) {
      // Ignore
    }
  }, [activeEmployee]);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthenticated(true);
        try {
          localStorage.setItem(STORAGE_SESSION_AUTH, 'true');
        } catch {
          // ignore
        }

        const userProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || activeEmployee.email,
          fullName: currentUser.displayName || activeEmployee.name,
          role: role,
        };
        setProfile(userProfile);

        // Sync with backend database
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile),
          });
        } catch (err) {
          console.warn('Sync user error:', err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  // Login with PIN
  const loginWithPin = async (
    employeeId: string,
    enteredPin: string
  ): Promise<{ success: boolean; error?: string }> => {
    const emp = allEmployees.find((e) => e.id === employeeId);
    if (!emp) {
      return { success: false, error: 'Empleado o usuario no encontrado.' };
    }

    const expectedPin = emp.pin || '1234';
    if (enteredPin.trim() !== expectedPin.trim()) {
      return {
        success: false,
        error: 'PIN de seguridad incorrecto. (PIN predeterminado de prueba: 1234)',
      };
    }

    // Success: activate session
    setActiveEmployee(emp);
    setRole(emp.role);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_SESSION_AUTH, 'true');
      localStorage.setItem(STORAGE_ACTIVE_EMPLOYEE, JSON.stringify(emp));
    } catch (e) {
      // ignore
    }

    // Sync with backend
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: emp.id,
          email: emp.email,
          name: emp.name,
          role: emp.role,
        }),
      });
    } catch (err) {
      console.warn('Sync user error:', err);
    }

    return { success: true };
  };

  // Register custom administrator / business owner
  const loginWithCustomAdmin = async (
    name: string,
    email: string,
    pin: string,
    customRole: UserRole = 'admin',
    businessName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newEmp: WorkshopEmployee = {
        id: 'owner-' + Date.now(),
        name,
        email,
        role: customRole,
        title: customRole === 'admin' ? 'Propietario / Jefe de Taller' : ROLE_LIMITATIONS[customRole].title,
        pin: pin || '1234',
        avatarColor:
          customRole === 'admin'
            ? 'bg-amber-600 text-slate-950 font-black'
            : customRole === 'supervisor'
            ? 'bg-blue-600 text-white'
            : 'bg-emerald-600 text-white',
      };

      const updatedCustom = [newEmp, ...customEmployees];
      setCustomEmployees(updatedCustom);
      try {
        localStorage.setItem(STORAGE_CUSTOM_EMPLOYEES, JSON.stringify(updatedCustom));
      } catch (e) {
        // ignore
      }

      setActiveEmployee(newEmp);
      setRole(newEmp.role);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_SESSION_AUTH, 'true');
        localStorage.setItem(STORAGE_ACTIVE_EMPLOYEE, JSON.stringify(newEmp));
      } catch (e) {
        // ignore
      }

      // If business name provided, update workshop branch name
      if (businessName) {
        try {
          await fetch('/api/branches/1', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-demo-user': email,
              'x-demo-role': 'admin',
            },
            body: JSON.stringify({
              name: businessName,
              type: 'workshop',
            }),
          });
        } catch (e) {
          console.warn('Could not update workshop branch name:', e);
        }
      }

      // Sync user to database
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: newEmp.id,
            email: newEmp.email,
            name: newEmp.name,
            role: newEmp.role,
          }),
        });
      } catch (err) {
        console.warn('Sync user error:', err);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar administrador.' };
    }
  };

  const selectEmployee = (emp: WorkshopEmployee) => {
    setActiveEmployee(emp);
    setRole(emp.role);
    setProfile({
      uid: emp.id,
      email: emp.email,
      fullName: emp.name,
      role: emp.role,
    });
    try {
      localStorage.setItem(STORAGE_ACTIVE_EMPLOYEE, JSON.stringify(emp));
    } catch (e) {
      // Ignore
    }
    setIsLoginModalOpen(false);
  };

  const setSimulatedRole = (newRole: UserRole) => {
    const defaultEmpForRole = allEmployees.find((e) => e.role === newRole) || {
      id: 'custom-' + newRole,
      name: `Empleado ${ROLE_LIMITATIONS[newRole].title}`,
      role: newRole,
      title: ROLE_LIMITATIONS[newRole].title,
      email: `${newRole}@mototaller.com`,
      avatarColor: 'bg-slate-700 text-white',
      pin: '1234',
    };
    selectEmployee(defaultEmpForRole);
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_SESSION_AUTH, 'true');
      } catch {
        // ignore
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión en Firebase:', error);
    } finally {
      setIsAuthenticated(false);
      try {
        localStorage.removeItem(STORAGE_SESSION_AUTH);
      } catch {
        // ignore
      }
    }
  };

  const lockScreen = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_SESSION_AUTH);
    } catch {
      // ignore
    }
  };

  // Explicit RBAC Permissions Gates
  const canEditVehicle = role === 'admin' || role === 'supervisor';
  const canDeleteVehicle = role === 'admin';
  const canCreateOrder = role === 'admin' || role === 'supervisor' || role === 'technician';
  const canDeleteOrder = role === 'admin';
  const canManageInventory = role === 'admin' || role === 'supervisor' || role === 'technician';
  const canDeletePart = role === 'admin';
  const canViewFinancials = role === 'admin' || role === 'supervisor';
  const canManageUsers = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        profile,
        role,
        activeEmployee,
        allEmployees,
        isLoginModalOpen,
        setIsLoginModalOpen,
        selectEmployee,
        setSimulatedRole,
        signInWithGoogle,
        loginWithPin,
        loginWithCustomAdmin,
        signOut,
        lockScreen,
        isLoading,
        canEditVehicle,
        canDeleteVehicle,
        canCreateOrder,
        canDeleteOrder,
        canManageInventory,
        canDeletePart,
        canViewFinancials,
        canManageUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
