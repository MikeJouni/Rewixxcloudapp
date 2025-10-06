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
      <header className="w-full bg-gray-800 text-white px-4 sm:px-8 py-6 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-light mb-4">
          Imad's Electrician Cloud App
        </h1>
        <Navigation />
      </header>

      <main className="flex-grow w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
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
