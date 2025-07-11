import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import Navigation from "./components/Navigation";
import NotFound from "./components/NotFound";
import CustomersPage from "./Pages/Customers";
import JobsPage from "./Pages/Jobs";
import ReportsPage from "./Pages/Reports";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-8 py-6 shadow-lg">
        <h1 className="text-3xl font-light mb-4">
          Cloud App/Electrician System
        </h1>
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
