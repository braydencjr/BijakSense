import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Map, 
  LayoutDashboard, 
  MessageSquare, 
  ListOrdered
} from 'lucide-react';
import { AGENTS } from '../../data/mock';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
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
      className="h-screen flex flex-col transition-colors duration-300 z-50 border-r bg-white border-gray-200 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="h-14 flex items-center justify-center p-2 border-b border-transparent shrink-0">
        <div className="w-6 h-6 bg-[#00D1C1] rounded-sm flex items-center justify-center text-white font-bold shrink-0 text-xs shadow-sm">
          M
        </div>
        {expanded && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-bold uppercase tracking-tight text-lg overflow-hidden whitespace-nowrap text-[#1A1A1A]"
          >
            MerchantMind
          </motion.span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link 
              key={link.to} 
              to={link.to}
              className={cn(
                "flex items-center px-2 py-2 rounded-lg transition-colors group",
                active 
                  ? "bg-[#00D1C1]/10 text-[#00D1C1]" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              <link.icon className={cn("w-5 h-5 shrink-0", active && "text-[#00D1C1]")} />
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

      <div className="p-4 border-t border-gray-200">
        <div className={cn("flex", expanded ? "justify-between items-center" : "justify-center")}>
          {expanded && <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">System Status</span>}
          <div className="flex gap-1.5 align-center justify-center">
            {AGENTS.map((a, i) => (
              <div 
                key={a.id} 
                title={a.name}
                className={cn(
                  "w-2 h-2 rounded-full",
                  a.status === 'processing' ? "bg-[#00D1C1] animate-pulse" : 
                  a.status === 'alert' ? "bg-[#FF4B4B]" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
