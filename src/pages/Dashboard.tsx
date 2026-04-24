import React from 'react';
import { INGREDIENTS, MERCHANT_INFO } from '../data/mock';
import { getCached, setCache, isCached } from '../lib/cache';
import { ArrowRight, CheckCircle, EyeOff, Bell, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  isActive?: boolean;
}

const T = {
  base: '#0C0D10',
  s1: '#111316',
  s2: '#16181C',
  s3: '#1C1E23',
  s4: '#22252B',
  border: 'rgba(255,255,255,0.05)',
  borderMd: 'rgba(255,255,255,0.09)',
  primary: '#F0F1F4',
  secondary: '#7A7F96',
  muted: '#44475A',
  teal: '#2DD4BF',
  tealDim: 'rgba(45,212,191,0.08)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.08)',
  ruby: '#F43F5E',
  rubyDim: 'rgba(244,63,94,0.07)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.08)',
};

const API = 'http://localhost:8000';
const INSIGHTS_CACHE_KEY = 'insights:v4';
const RECS_CACHE_KEY = 'recs:v2';
const DISMISSED_KEY = 'dismissed:v1';
const INSIGHTS_TTL_MS = 30 * 1000;
const RECS_TTL_MS = 60 * 1000;

type InsightStatus = 'active' | 'resolved' | 'ignored';

function urgencyColor(urgency: string) {
  if (urgency === 'red') return { dot: T.ruby, bg: T.rubyDim, text: '#FB7185' };
  if (urgency === 'amber') return { dot: T.amber, bg: T.amberDim, text: '#FCD34D' };
  return { dot: T.teal, bg: T.tealDim, text: T.teal };
}

function urgencyLabel(urgency: string) {
  if (urgency === 'red') return 'Action needed';
  if (urgency === 'amber') return 'Watch';
  return 'Opportunity';
}

function urgencyIcon(urgency: string) {
  if (urgency === 'red') return <AlertTriangle style={{ width: 14, height: 14 }} />;
  if (urgency === 'amber') return <Bell style={{ width: 14, height: 14 }} />;
  return <TrendingUp style={{ width: 14, height: 14 }} />;
}

export default function Dashboard({ isActive = true }: DashboardProps) {
  const [insights, setInsights] = React.useState<any[]>(() => getCached<any[]>(INSIGHTS_CACHE_KEY) || []);
  const [liveRecs, setLiveRecs] = React.useState<any[]>(() => getCached<any[]>(RECS_CACHE_KEY) || []);
  const [insightsLoaded, setInsightsLoaded] = React.useState(isCached(INSIGHTS_CACHE_KEY));
  const [hasInitialized, setHasInitialized] = React.useState(
    isActive || isCached(INSIGHTS_CACHE_KEY) || isCached(RECS_CACHE_KEY)
  );
  const [expandedInsight, setExpandedInsight] = React.useState<string | null>(null);
  const [statuses, setStatuses] = React.useState<Record<string, InsightStatus>>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}'); } catch { return {}; }
  });

  const setStatus = (id: string, status: InsightStatus) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: status };
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
    if (expandedInsight === id) setExpandedInsight(null);
  };

  React.useEffect(() => {
    if (isActive) setHasInitialized(true);
  }, [isActive]);

  React.useEffect(() => {
    if (!hasInitialized || isCached(RECS_CACHE_KEY)) return;
    fetch(`${API}/api/recommendations?status=all`)
      .then(r => r.json())
      .then(data => { const arr = Array.isArray(data) ? data : []; setLiveRecs(arr); setCache(RECS_CACHE_KEY, arr, { ttlMs: RECS_TTL_MS }); })
      .catch(() => { });
  }, [hasInitialized]);

  React.useEffect(() => {
    if (!hasInitialized) return;
    if (isCached(INSIGHTS_CACHE_KEY)) { setInsightsLoaded(true); return; }
    fetch(`${API}/api/insights`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data.insights) ? data.insights : [];
        setInsights(arr);
        setCache(INSIGHTS_CACHE_KEY, arr, { ttlMs: INSIGHTS_TTL_MS });
        setInsightsLoaded(true);
      })
      .catch(() => setInsightsLoaded(true));
  }, [hasInitialized]);

  const criticalIngredients = INGREDIENTS.filter(i => i.alert || i.stockDays <= i.reorderPoint).slice(0, 3);

  const sortedInsights = [...insights].sort((a, b) => {
    const order: Record<string, number> = { red: 0, amber: 1, teal: 2 };
    return (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3);
  });
  const activeInsights = sortedInsights.filter(i => !statuses[i.id] || statuses[i.id] === 'active');
  const resolvedCount = Object.values(statuses).filter(s => s === 'resolved').length;
  const ignoredCount = Object.values(statuses).filter(s => s === 'ignored').length;

  const redCount = activeInsights.filter(i => i.urgency === 'red').length;
  const amberCount = activeInsights.filter(i => i.urgency === 'amber').length;

  return (
    <div className="flex-1 h-full overflow-y-auto" style={{ background: T.base, color: T.primary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.s1 }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Command Center
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: T.primary, margin: 0, letterSpacing: '-0.02em' }}>
              Good Day,  {MERCHANT_INFO.businessName}
            </h1>
          </div>
          <Link to="/chat"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#fff', background: T.teal, textDecoration: 'none', flexShrink: 0, letterSpacing: '-0.01em' }}>
            Ask Co-Pilot <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '40px 48px 80px' }}>

        {/* ── SUMMARY ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            {
              label: 'Needs attention',
              value: redCount,
              detail: `${amberCount} to watch`,
              color: redCount > 0 ? T.ruby : T.muted,
            },
            {
              label: 'Supply risk items',
              value: criticalIngredients.length,
              detail: criticalIngredients.length > 0 ? criticalIngredients.map(i => i.name).join(', ') : 'All stocked',
              color: criticalIngredients.length > 0 ? T.amber : T.green,
            },
            {
              label: 'Resolved today',
              value: resolvedCount + ignoredCount,
              detail: `${resolvedCount} resolved · ${ignoredCount} ignored`,
              color: T.teal,
            },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <p style={{ fontSize: 12, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 12px' }}>{card.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: card.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{card.value}</span>
              </div>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.5 }}>{card.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT: Insight list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: T.secondary, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Insights · {activeInsights.length} active
              </h2>
              <Link to="/map" style={{ fontSize: 14, color: T.teal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                View map <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>

            {!insightsLoaded ? (
              <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: T.secondary }}>
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: T.teal }} />
                  Generating insights...
                </div>
              </div>
            ) : activeInsights.length === 0 ? (
              <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
                <CheckCircle style={{ width: 24, height: 24, color: T.green, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, color: T.secondary, margin: 0 }}>All clear — no active insights right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeInsights.map((insight: any, idx: number) => {
                  const isExpanded = expandedInsight === insight.id;
                  const uc = urgencyColor(insight.urgency);
                  const rank = idx + 1;

                  return (
                    <motion.div key={insight.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      layout
                      style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>

                      <div
                        onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 18, padding: '20px 24px', cursor: 'pointer' }}>

                        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: T.s3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: rank <= 2 ? uc.text : T.muted, marginTop: 2 }}>
                          {rank}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: uc.text, background: uc.bg, padding: '4px 10px', borderRadius: 6 }}>
                              {urgencyIcon(insight.urgency)}
                              {urgencyLabel(insight.urgency)}
                            </span>
                            <span style={{ fontSize: 13, color: T.muted, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {insight.headline}
                            </span>
                          </div>

                          <p style={{ fontSize: 17, fontWeight: 500, color: T.primary, margin: 0, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                            {insight.action}
                          </p>
                        </div>

                        <button style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, marginTop: 4 }}>
                          {isExpanded ? <ChevronUp style={{ width: 20, height: 20 }} /> : <ChevronDown style={{ width: 20, height: 20 }} />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}>
                            <div style={{ borderTop: `1px solid ${T.border}`, padding: '20px 24px 24px 74px' }}>

                              {insight.reasoning && (
                                <div style={{ marginBottom: insight.steps?.length ? 20 : 0 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Why this matters</p>
                                  <p style={{ fontSize: 15, color: T.secondary, margin: 0, lineHeight: 1.7 }}>{insight.reasoning}</p>
                                </div>
                              )}

                              {insight.steps?.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Suggested steps</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {insight.steps.map((step: string, si: number) => (
                                      <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: T.secondary }}>
                                        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: T.s3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.muted, marginTop: 2 }}>{si + 1}</span>
                                        <span style={{ lineHeight: 1.6 }}>{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setStatus(insight.id, 'resolved'); }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, border: `1px solid rgba(34,197,94,0.3)`, background: 'rgba(34,197,94,0.07)', color: T.green, cursor: 'pointer' }}>
                                  <CheckCircle style={{ width: 16, height: 16 }} /> Mark resolved
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setStatus(insight.id, 'ignored'); }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.s3, color: T.muted, cursor: 'pointer' }}>
                                  <EyeOff style={{ width: 16, height: 16 }} /> Ignore
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Inventory alerts */}
            <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Package style={{ width: 16, height: 16, color: T.muted }} />
                <h3 style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Inventory</h3>
              </div>
              {criticalIngredients.length === 0 ? (
                <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>All ingredients stocked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {criticalIngredients.map((item: any) => {
                    const pct = Math.max(0, Math.min(100, (item.stockDays / 30) * 100));
                    const barColor = pct < 20 ? T.ruby : pct < 40 ? T.amber : T.teal;
                    return (
                      <div key={item.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>{item.name}</span>
                          <span style={{ fontSize: 13, color: T.muted }}>{item.stockDays}d left</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: T.s3, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.5 }}
                            style={{ height: '100%', borderRadius: 3, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>Today's signals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Total insights', value: insights.length, color: T.primary },
                  { label: 'Action needed', value: redCount, color: redCount > 0 ? T.ruby : T.muted },
                  { label: 'Watching', value: amberCount, color: amberCount > 0 ? T.amber : T.muted },
                  { label: 'Resolved', value: resolvedCount, color: T.green },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: T.muted }}>{row.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI summary */}
            <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <p style={{ fontSize: 14, color: T.secondary, margin: '0 0 16px', lineHeight: 1.6 }}>
                Your AI processed <strong style={{ color: T.primary, fontWeight: 600 }}>{insights.length + liveRecs.length}</strong> signals and ranked {insights.length} insights by priority.
              </p>
              <Link to="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: T.teal, textDecoration: 'none' }}>
                Intelligence map <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
