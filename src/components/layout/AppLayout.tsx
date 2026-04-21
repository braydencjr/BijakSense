import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const location = useLocation();
  const isMapLayer = location.pathname === '/map';

  return (
    <div className={cn("flex h-screen overflow-hidden text-[#1A1A1A] font-sans",
      isMapLayer ? "bg-[#E2E8F0]" : "bg-[#F8F9FA]"
    )}>
      <Sidebar />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
