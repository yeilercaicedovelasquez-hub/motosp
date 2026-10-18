import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar, TabType } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { VehiclesView } from './components/VehiclesView.tsx';
import { VehicleTimelineView } from './components/VehicleTimelineView.tsx';
import { WorkOrdersView } from './components/WorkOrdersView.tsx';
import { PreventivePlansView } from './components/PreventivePlansView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AuditView } from './components/AuditView.tsx';
import { EmployeeLoginModal } from './components/EmployeeLoginModal.tsx';
import { LoginView } from './components/LoginView.tsx';

import {
  Vehicle,
  DashboardStats,
  WorkOrder,
  PartInventory,
  MaintenancePlan,
  Branch,
} from './types.ts';

function MainApp() {
  const { isLoginModalOpen, setIsLoginModalOpen, activeEmployee, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<PartInventory[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderVehicleId, setNewOrderVehicleId] = useState<number | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop sidebar collapsed state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('motogestion_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('motogestion_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all core system data
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [vRes, sRes, oRes, iRes, pRes, bRes] = await Promise.all([
        fetch('/api/vehicles').then((r) => r.json()),
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/inventory').then((r) => r.json()),
        fetch('/api/plans').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
      ]);

      setVehicles(Array.isArray(vRes) ? vRes : []);
      setStats(sRes && !sRes.error ? sRes : null);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setInventory(Array.isArray(iRes) ? iRes : []);
      setPlans(Array.isArray(pRes) ? pRes : []);
      setBranches(Array.isArray(bRes) ? bRes : []);

      if (Array.isArray(vRes) && vRes.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vRes[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos del sistema:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectVehicleForTimeline = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setCurrentTab('timeline');
    setMobileMenuOpen(false);
  };

  const handleOpenOrderForVehicle = (vehicleId?: number) => {
    setNewOrderVehicleId(vehicleId);
    setCurrentTab('orders');
    setIsNewOrderOpen(true);
    setMobileMenuOpen(false);
  };

  const handleOpenNewVehicle = () => {
    setCurrentTab('vehicles');
    setIsNewVehicleOpen(true);
    setMobileMenuOpen(false);
  };

  // If not authenticated, require login to access the workshop system
  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLoginSuccess={() => fetchData()} />
        <EmployeeLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans text-slate-900">
      {/* Desktop Sidebar (Collapsible with smooth transition) */}
      <div
        className={`hidden md:flex shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        <div className="w-64 shrink-0">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={(tab) => setCurrentTab(tab)}
            pendingOrdersCount={stats?.pendingOrders}
            urgentAlertsCount={stats?.alerts?.length}
            lowStockCount={stats?.lowStockParts}
          />
        </div>
      </div>

      {/* Mobile Drawer (Activated/Deactivated via Hamburger Menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              onClose={() => setMobileMenuOpen(false)}
              pendingOrdersCount={stats?.pendingOrders}
              urgentAlertsCount={stats?.alerts?.length}
              lowStockCount={stats?.lowStockParts}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenNewVehicle={handleOpenNewVehicle}
          onOpenNewOrder={() => handleOpenOrderForVehicle()}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          isMobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          isDesktopSidebarOpen={!isSidebarCollapsed}
          onToggleDesktopSidebar={toggleSidebarCollapse}
        />

        {/* Dynamic View Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                recentOrders={orders}
                vehicles={vehicles}
                onSelectVehicle={handleSelectVehicleForTimeline}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onOpenNewOrder={handleOpenOrderForVehicle}
              />
            )}

            {currentTab === 'vehicles' && (
              <VehiclesView
                vehicles={vehicles}
                branches={branches}
                onSelectVehicle={handleSelectVehicleForTimeline}
                onRefresh={fetchData}
                isCreateOpen={isNewVehicleOpen}
                setIsCreateOpen={setIsNewVehicleOpen}
                onOpenNewOrder={handleOpenOrderForVehicle}
              />
            )}

            {currentTab === 'timeline' && (
              <VehicleTimelineView
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicleId={(id) => setSelectedVehicleId(id)}
                onRefresh={fetchData}
                onNavigateToVehicles={() => setCurrentTab('vehicles')}
              />
            )}

            {currentTab === 'orders' && (
              <WorkOrdersView
                orders={orders}
                vehicles={vehicles}
                inventory={inventory}
                onRefresh={fetchData}
                isOpenCreate={isNewOrderOpen}
                setIsOpenCreate={setIsNewOrderOpen}
                defaultVehicleId={newOrderVehicleId}
              />
            )}

            {currentTab === 'plans' && (
              <PreventivePlansView
                plans={plans}
                vehicles={vehicles}
                onRefresh={fetchData}
                onSelectVehicle={handleSelectVehicleForTimeline}
                onOpenNewOrder={handleOpenOrderForVehicle}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView inventory={inventory} onRefresh={fetchData} />
            )}

            {currentTab === 'reports' && (
              <ReportsView vehicles={vehicles} onRefresh={fetchData} />
            )}

            {currentTab === 'audit' && <AuditView />}
          </div>
        </main>
      </div>

      {/* Employee Role Selection & Limitations Modal */}
      <EmployeeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
