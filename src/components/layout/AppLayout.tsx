import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <Sidebar />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
