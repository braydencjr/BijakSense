import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Onboarding from './pages/Onboarding';
import WorkspaceTabs from './pages/WorkspaceTabs';
import Chat from './pages/Chat';
import InventoryPlanner from './pages/InventoryPlanner';

const ONBOARDING_COMPLETE_KEY = 'bijaksense:onboardingComplete';

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
              ? <Navigate to="/map" replace />
              : <Onboarding onComplete={handleOnboardingComplete} />
          }
        />

        {/* Main Application Layout */}
        <Route element={onboardingComplete ? <AppLayout /> : <Navigate to="/onboarding" replace />}>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<WorkspaceTabs />} />
          <Route path="/dashboard" element={<WorkspaceTabs />} />
          <Route path="/recommendations" element={<WorkspaceTabs />} />
          <Route path="/chat" element={<Chat />} />

          {/* Legacy routes */}
          <Route path="/inventory" element={<InventoryPlanner />} />
          <Route path="/market" element={<Navigate to="/map" replace />} />
          <Route path="/run-hub" element={<Navigate to="/dashboard" replace />} />
          <Route path="/found-hub" element={<Navigate to="/map" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={onboardingComplete ? '/map' : '/onboarding'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
