import React, { useState } from 'react';
import './App.css';
import Customers from './components/Customers';
import Jobs from './components/Jobs';
import Reports from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('customers');

  const renderActiveComponent = () => {
    switch(activeTab) {
      case 'customers':
        return <Customers />;
      case 'jobs':
        return <Jobs />;
      case 'reports':
        return <Reports />;
      default:
        return <Customers />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Cloud App/Electrician System</h1>
        <nav className="navigation">
          <button 
            className={activeTab === 'customers' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
          <button 
            className={activeTab === 'jobs' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button 
            className={activeTab === 'reports' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;