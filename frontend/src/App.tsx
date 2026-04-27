import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { Layout } from './components/Layout';
import { InitialSplash } from './pages/InitialSplash';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ServiceOrdersPage } from './pages/ServiceOrdersPage';
import { ServicesPage } from './pages/ServicesPage';
import { InventoryPage } from './pages/InventoryPage';
import { FinancialPage } from './pages/FinancialPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Splash Inicial que leva ao Login */}
        <Route path="/" element={<InitialSplash />} />
        
        {/* Área de Gestão Global (Sem proteção para facilitar desenvolvimento) */}
        <Route path="/admin" element={<SuperAdminPage />} />

        
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        {/* Splash Pós-Login com resumo de funcionalidades (30s) */}
        <Route path="/welcome" element={<WelcomePage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/service-orders" element={<ServiceOrdersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}