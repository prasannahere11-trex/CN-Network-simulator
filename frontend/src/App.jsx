import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import TopologyPage from './pages/TopologyPage';
import DevicesPage from './pages/DevicesPage';
import PacketSimulatorPage from './pages/PacketSimulatorPage';
import RoutingPage from './pages/RoutingPage';
import MonitoringPage from './pages/MonitoringPage';
import SimulationPage from './pages/SimulationPage';
import SettingsPage from './pages/SettingsPage';
import { checkHealth } from './services/deviceService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Poll backend health status
  const verifyBackendHealth = useCallback(async () => {
    try {
      const res = await checkHealth();
      if (res && res.status === 'ok') {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // Initial health check
    verifyBackendHealth();

    // Health poll interval every 5 seconds
    const interval = setInterval(verifyBackendHealth, 5000);
    return () => clearInterval(interval);
  }, [verifyBackendHealth]);

  const handleDeviceChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            isConnected={isConnected}
            onNavigate={(tab) => setActiveTab(tab)}
            key={refreshTrigger}
          />
        );
      case 'topology':
        return (
          <TopologyPage
            onDeviceChanged={handleDeviceChanged}
            key={refreshTrigger}
          />
        );
      case 'devices':
        return (
          <DevicesPage
            onDeviceChanged={handleDeviceChanged}
            key={refreshTrigger}
          />
        );
      case 'packet-simulator':
        return <PacketSimulatorPage key={refreshTrigger} />;
      case 'routing':
        return <RoutingPage key={refreshTrigger} />;
      case 'monitoring':
        return <MonitoringPage key={refreshTrigger} />;
      case 'simulation':
        return <SimulationPage key={refreshTrigger} />;
      case 'settings':
        return <SettingsPage key={refreshTrigger} />;
      default:
        return (
          <DashboardPage
            isConnected={isConnected}
            onNavigate={(tab) => setActiveTab(tab)}
            key={refreshTrigger}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      
      <div className="main-wrapper">
        <Header activeTab={activeTab} isConnected={isConnected} />
        <main className="content-container">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
