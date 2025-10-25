import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "./antd-table-overrides.css";
import "./table-responsive.css";
import Navigation from "./components/Navigation";
import NotFound from "./components/NotFound";
import CustomersPage from "./Pages/Customers";
import JobsPage from "./Pages/Jobs";
import ReportsPage from "./Pages/Reports";
import Footer from "./components/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
  return (
    <div className="min-h-screen flex flex-col w-full h-full" style={{ background: '#f0f2f5' }}>
      {/* Modern Navigation Bar */}
      <Navigation />

      {/* Main Content Area - Full Width on Large Screens */}
      <main className="flex-grow w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        <div className="w-full max-w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers/*" element={<CustomersPage />} />
            <Route path="/jobs/*" element={<JobsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <Footer />
      </footer>
    </div>
  );
}

export default App;
