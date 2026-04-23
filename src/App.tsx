import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Onboarding from './pages/Onboarding';
import IntelligenceMap from './pages/IntelligenceMap';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Recommendations from './pages/Recommendations';
import InventoryPlanner from './pages/InventoryPlanner';

const ONBOARDING_COMPLETE_KEY = 'merchantmind:onboardingComplete';

function readOnboardingFlag() {
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  // Reactive state — so when Onboarding calls onComplete(), routes re-render immediately
  const [onboardingComplete, setOnboardingComplete] = useState(readOnboardingFlag);

  function handleOnboardingComplete() {
    setOnboardingComplete(true);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/onboarding"
          element={
            onboardingComplete
              ? <Navigate to="/dashboard" replace />
              : <Onboarding onComplete={handleOnboardingComplete} />
          }
        />

        {/* Main Application Layout */}
        <Route element={onboardingComplete ? <AppLayout /> : <Navigate to="/onboarding" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/map" element={<IntelligenceMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/recommendations" element={<Recommendations />} />

          {/* Legacy routes */}
          <Route path="/inventory" element={<InventoryPlanner />} />
          <Route path="/market" element={<Navigate to="/map" replace />} />
          <Route path="/run-hub" element={<Navigate to="/dashboard" replace />} />
          <Route path="/found-hub" element={<Navigate to="/map" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={onboardingComplete ? '/dashboard' : '/onboarding'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
