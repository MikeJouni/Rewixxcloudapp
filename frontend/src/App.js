import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "./antd-table-overrides.css";
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
    <div className="min-h-screen flex flex-col bg-gray-50 w-full h-full">
      <header className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white px-4 sm:px-8 py-6 sm:py-8 shadow-2xl relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              ⚡ Imad's Electrical Services
            </h1>
          </div>
          <Navigation />
        </div>
      </header>

      <main className="flex-grow w-full px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers/*" element={<CustomersPage />} />
            <Route path="/jobs/*" element={<JobsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <footer>
        <Footer />
      </footer>
    </div>
  );
}

export default App;
