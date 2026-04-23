import React from 'react';
import { useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import IntelligenceMap from './IntelligenceMap';

export default function WorkspaceTabs() {
  const location = useLocation();
  const dashboardActive = location.pathname === '/dashboard' || location.pathname === '/';
  const mapActive = location.pathname === '/map';

  return (
    <div className="flex-1 min-h-0 relative">
      <div className="absolute inset-0 min-h-0" style={{ display: dashboardActive ? 'block' : 'none' }}>
        <Dashboard isActive={dashboardActive} />
      </div>
      <div className="absolute inset-0 min-h-0" style={{ display: mapActive ? 'block' : 'none' }}>
        <IntelligenceMap isActive={mapActive} />
      </div>
    </div>
  );
}
