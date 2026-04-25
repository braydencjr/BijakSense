import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getCached, setCache } from '../lib/cache';
import { inferAgentLabel } from '../lib/agents';

interface RecommendationsProps {
  isActive?: boolean;
}

const API = 'http://localhost:8000';
const INSIGHTS_CACHE_KEY = 'insights:v5';
const DISMISSED_KEY = 'dismissed:v1';
const FILTERS = ['all', 'pending', 'acted_on', 'dismissed'] as const;
const T = {
  base: '#0C0D10',
  s1: '#111316',
  s2: '#16181C',
  border: 'rgba(255,255,255,0.05)',
  primary: '#F0F1F4',
  secondary: '#7A7F96',
  muted: '#44475A',
  teal: '#2DD4BF',
  tealDim: 'rgba(45,212,191,0.08)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.08)',
  ruby: '#F43F5E',
  rubyDim: 'rgba(244,63,94,0.07)',
};

export default function Recommendations({ isActive = true }: RecommendationsProps) {
  const [filter, setFilter] = useState('all');
  const [allRecommendations, setAllRecommendations] = useState<any[]>(() => getCached<any[]>(INSIGHTS_CACHE_KEY) || []);
  const [loading, setLoading] = useState(true);
  const [statuses] = useState<Record<string, 'active' | 'resolved' | 'ignored'>>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!isActive) return;

    async function loadAllRecs() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/insights`);
        const data = await res.json();
        const next = Array.isArray(data.insights) ? data.insights : [];
        setAllRecommendations(next);
        setCache(INSIGHTS_CACHE_KEY, next, { ttlMs: null });
      } catch (e) {
        console.error("Failed to fetch backend insights", e);
      } finally {
        setLoading(false);
      }
    }

    const cached = getCached<any[]>(INSIGHTS_CACHE_KEY);
    if (cached && cached.length > 0) {
      setAllRecommendations(cached);
      setLoading(false);
    }
    loadAllRecs();
  }, [isActive]);

  const historical = allRecommendations
    .map((item) => {
      const insightStatus = statuses[item.id] || 'active';
      return {
        ...item,
        detail: item.action,
        agent: inferAgentLabel(item),
        status:
          insightStatus === 'resolved'
            ? 'acted_on'
            : insightStatus === 'ignored'
              ? 'dismissed'
              : 'pending',
        time: 'Generated insight',
      };
    })
    .filter((item) => filter === 'all' || item.status === filter);

  const urgencyColor = (u: string) => u === 'red' ? '#FF4B4B' : u === 'amber' ? '#FFB000' : '#00D1C1';
  const statusStyle = (s: string) => {
    if (s === 'pending') return { background: 'rgba(255,176,0,0.12)', color: '#FFB000', border: '1px solid rgba(255,176,0,0.2)' };
    if (s === 'acted_on') return { background: 'rgba(0,209,193,0.1)', color: '#00D1C1', border: '1px solid rgba(0,209,193,0.2)' };
    return { background: 'rgba(255,255,255,0.05)', color: '#4B5563', border: '1px solid rgba(255,255,255,0.08)' };
  };

  return (
    <div className="flex-1 h-full overflow-y-auto" style={{ background: T.base, color: T.primary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.s1 }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Accountability
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: T.primary, margin: 0, letterSpacing: '-0.02em' }}>
              Action Log
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: filter === f ? '1px solid rgba(45,212,191,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: filter === f ? 'rgba(45,212,191,0.12)' : T.s2,
                  color: filter === f ? T.teal : T.secondary,
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '40px 48px 80px' }}>
        {loading ? (
          <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 32px', color: T.secondary }}>
            Loading action log...
          </div>
        ) : historical.length === 0 ? (
          <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center', color: T.secondary }}>
            No recommendations found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {historical.map((item, i) => (
              <motion.div
                key={item.id ?? i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 24px', display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr) 120px', gap: 24, alignItems: 'start' }}
              >
                <div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {item.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', background: urgencyColor(item.urgency), boxShadow: `0 0 6px ${urgencyColor(item.urgency)}` }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.secondary }}>
                      {item.agent}
                    </span>
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: T.primary }}>
                    {item.headline}
                  </h3>
                  <p style={{ fontSize: 14, color: T.secondary, margin: 0, lineHeight: 1.6 }}>
                    {item.detail}
                  </p>

                  {('note' in item) && item.note && (
                    <div
                      style={{ marginTop: 12, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}
                    >
                      <CheckCircle2 style={{ width: 16, height: 16, color: T.teal, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>
                        "{(item as any).note}"
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      ...statusStyle(item.status),
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
