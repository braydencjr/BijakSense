import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Map, 
  LayoutDashboard, 
  MessageSquare, 
  ListOrdered,
  LogOut
} from 'lucide-react';
import { AGENTS } from '../../data/mock';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function handleLogout() {
  localStorage.removeItem('merchantmind:onboardingComplete');
  localStorage.removeItem('merchantmind:business');
  window.location.href = '/onboarding';
}

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/map', icon: Map, label: 'Intelligence Map' },
    { to: '/chat', icon: MessageSquare, label: 'Co-Pilot Chat' },
    { to: '/recommendations', icon: ListOrdered, label: 'Action Log' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: expanded ? 220 : 60 }}
      className="h-screen flex flex-col z-50 relative shrink-0"
      style={{
        background: '#111318',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setShowLogoutConfirm(false); }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center p-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold shrink-0 text-xs"
          style={{ background: 'linear-gradient(135deg,#00D1C1,#00BCAE)', boxShadow: '0 0 12px rgba(0,209,193,0.4)' }}
        >
          M
        </div>
        {expanded && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-bold uppercase tracking-tight text-base overflow-hidden whitespace-nowrap"
            style={{ color: '#F8F9FA' }}
          >
            MerchantMind
          </motion.span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link 
              key={link.to} 
              to={link.to}
              className={cn(
                "flex items-center px-2 py-2.5 rounded-lg transition-all group relative",
              )}
              style={{
                background: active ? 'rgba(0,209,193,0.12)' : 'transparent',
                color: active ? '#00D1C1' : '#6B7280',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: '#00D1C1', boxShadow: '0 0 8px #00D1C1' }}
                />
              )}
              <link.icon className="w-5 h-5 shrink-0" />
              <div 
                className={cn(
                  "ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 text-sm font-medium",
                  expanded ? "opacity-100" : "opacity-0 w-0"
                )}
              >
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — agent status + logout */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Agent dots */}
        <div className={cn("flex", expanded ? "justify-between items-center" : "justify-center")}>
          {expanded && <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#4B5563' }}>System Status</span>}
          <div className="flex gap-1.5 align-center justify-center">
            {AGENTS.map((a) => (
              <div 
                key={a.id} 
                title={a.name}
                className={cn(
                  "w-2 h-2 rounded-full",
                  a.status === 'processing' ? "animate-pulse" : ''
                )}
                style={{
                  background: a.status === 'processing' ? '#00D1C1' :
                               a.status === 'alert' ? '#FF4B4B' : '#374151',
                  boxShadow: a.status === 'processing' ? '0 0 6px #00D1C1' :
                              a.status === 'alert' ? '0 0 6px #FF4B4B' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Logout button */}
        <div className="relative">
          <AnimatePresence>
            {showLogoutConfirm && expanded && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl z-50"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <p className="text-xs mb-3 leading-snug" style={{ color: '#9CA3AF' }}>
                  Exit to startup page? Your session will be cleared.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#FF4B4B,#E64343)' }}
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowLogoutConfirm(v => !v)}
            title="Logout / Restart"
            className={cn(
              "w-full flex items-center px-2 py-2.5 rounded-lg transition-all",
            )}
            style={{
              color: showLogoutConfirm ? '#FF4B4B' : '#4B5563',
              background: showLogoutConfirm ? 'rgba(255,75,75,0.1)' : 'transparent',
            }}
            onMouseEnter={e => { if (!showLogoutConfirm) { e.currentTarget.style.color = '#FF4B4B'; e.currentTarget.style.background = 'rgba(255,75,75,0.07)'; }}}
            onMouseLeave={e => { if (!showLogoutConfirm) { e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.background = 'transparent'; }}}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <div
              className={cn(
                "ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 text-sm font-medium",
                expanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              Logout
            </div>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
