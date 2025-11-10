import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Grid } from "antd";
import "./index.css";
import "./antd-table-overrides.css";
import "./table-responsive.css";
import "./sidebar-responsive.css";
import Navigation from "./components/Navigation";
import NotFound from "./components/NotFound";
import CustomersPage from "./Pages/Customers";
import JobsPage from "./Pages/Jobs";
import EmployeesPage from "./Pages/Employees";
import ExpensesPage from "./Pages/Expenses";
import ContractsPage from "./Pages/Contracts";
import ReportsPage from "./Pages/Reports";
import Footer from "./components/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const { useBreakpoint } = Grid;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const screens = useBreakpoint();

  // Breakpoints: mobile (< md), tablet (md to lg), desktop (>= lg)
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  // Calculate sidebar width based on screen size and collapsed state
  // Use 0 for mobile to ensure smooth transitions
  const getSidebarWidth = () => {
    if (isMobile) return 0;
    if (isTablet) return 64;
    if (isDesktop) return sidebarCollapsed ? 64 : 200;
    return 0; // Fallback
  };

  const sidebarWidth = getSidebarWidth();

  // Reset sidebar state when screen size changes
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    }
  }, [isTablet]);

  return (
    <div className="min-h-screen flex flex-col w-full h-full" style={{ background: '#f0f2f5' }}>
      {/* Modern Navigation Bar */}
      <Navigation
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area - Adjusts for Sidebar */}
      <main
        className="flex-grow w-full py-4 sm:py-6"
        style={{
          marginLeft: `${sidebarWidth}px`,
          paddingLeft: isMobile ? '8px' : '24px',
          paddingRight: isMobile ? '8px' : '24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <div className="w-full max-w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers/*" element={<CustomersPage />} />
            <Route path="/jobs/*" element={<JobsPage />} />
            <Route path="/employees/*" element={<EmployeesPage />} />
            <Route path="/expenses/*" element={<ExpensesPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <Footer />
      </footer>
    </div>
  );
}

export default App;
