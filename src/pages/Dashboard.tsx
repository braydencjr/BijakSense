import React from 'react';
import { INGREDIENTS, MERCHANT_INFO } from '../data/mock';
import { getCached, setCache, isCached } from '../lib/cache';
import {
  Sparkles, ArrowRight, CheckCircle2, Zap, BarChart2, ShieldAlert,
  TrendingUp, AlertTriangle, Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface DashboardProps {
  isActive?: boolean;
}

const T = {
  base:     '#09090F',
  s1:       '#13141A',
  s2:       '#1C1D25',
  s3:       '#24252F',
  border:   'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.11)',
  primary:  '#ECEEF2',
  secondary:'#8B8FA8',
  muted:    '#52556A',
  teal:     '#2DD4BF',
  tealDim:  'rgba(45,212,191,0.14)',
  amber:    '#F59E0B',
  amberDim: 'rgba(245,158,11,0.12)',
  ruby:     '#F43F5E',
  rubyDim:  'rgba(244,63,94,0.1)',
};

const API = 'http://localhost:8000';
const INSIGHTS_CACHE_KEY = 'insights:v3';
const RECS_CACHE_KEY = 'recs:v1';

function urgencyAccent(urgency: string) {
  if (urgency === 'red')   return { color: T.ruby,  dim: T.rubyDim,  border: 'rgba(244,63,94,0.22)' };
  if (urgency === 'amber') return { color: T.amber, dim: T.amberDim, border: 'rgba(245,158,11,0.2)' };
  return                          { color: T.teal,  dim: T.tealDim,  border: 'rgba(45,212,191,0.18)' };
}

function urgencyIcon(urgency: string) {
  if (urgency === 'red')   return <AlertTriangle className="w-3 h-3" style={{ color: T.ruby }} />;
  if (urgency === 'amber') return <TrendingUp className="w-3 h-3" style={{ color: T.amber }} />;
  return <Target className="w-3 h-3" style={{ color: T.teal }} />;
}

export default function Dashboard({ isActive = true }: DashboardProps) {
  const [insights, setInsights] = React.useState<any[]>(() => getCached<any[]>(INSIGHTS_CACHE_KEY) || []);
  const [liveRecs, setLiveRecs] = React.useState<any[]>(() => getCached<any[]>(RECS_CACHE_KEY) || []);
  const [insightsLoaded, setInsightsLoaded] = React.useState(isCached(INSIGHTS_CACHE_KEY));
  const [hasInitialized, setHasInitialized] = React.useState(
    isActive || isCached(INSIGHTS_CACHE_KEY) || isCached(RECS_CACHE_KEY)
  );

  React.useEffect(() => {
    if (isActive) setHasInitialized(true);
  }, [isActive]);

  React.useEffect(() => {
    if (!hasInitialized) return;
    if (isCached(RECS_CACHE_KEY)) return;

    fetch(`${API}/api/recommendations?status=all`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setLiveRecs(arr);
        setCache(RECS_CACHE_KEY, arr, { ttlMs: null });
      })
      .catch(() => {});
  }, [hasInitialized]);

  React.useEffect(() => {
    if (!hasInitialized) return;
    if (isCached(INSIGHTS_CACHE_KEY)) {
      setInsightsLoaded(true);
      return;
    }

    fetch(`${API}/api/insights`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data.insights) ? data.insights : [];
        setInsights(arr);
        setCache(INSIGHTS_CACHE_KEY, arr, { ttlMs: null });
        setInsightsLoaded(true);
      })
      .catch(() => {
        setInsightsLoaded(true);
      });
  }, [hasInitialized]);

  const criticalIngredients = INGREDIENTS.filter(i => i.alert || i.stockDays <= i.reorderPoint).slice(0, 3);
  const redCount = insights.filter(i => i.urgency === 'red').length;
  const amberCount = insights.filter(i => i.urgency === 'amber').length;

  const kpis = [
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'AI Insights',
      value: String(insights.length),
      sub: `${redCount} urgent · ${amberCount} watch`,
      accent: T.teal,
      dim: T.tealDim,
    },
    {
      icon: <ShieldAlert className="w-4 h-4" />,
      label: 'Supply Risk',
      value: criticalIngredients.length > 0 ? 'Elevated' : 'Moderate',
      sub: `${criticalIngredients.length} ingredients near threshold`,
      accent: T.amber,
      dim: T.amberDim,
    },
    {
      icon: <BarChart2 className="w-4 h-4" />,
      label: 'Competitor Threat',
      value: 'High',
      sub: '2 competitors with active promos within 1.5km',
      accent: T.ruby,
      dim: T.rubyDim,
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto font-sans" style={{ background: T.base, color: T.primary }}>
      <header className="px-8 py-5 shrink-0" style={{ background: T.s1, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
                className="w-2 h-2 rounded-full" style={{ background: T.teal, boxShadow: `0 0 6px ${T.teal}` }} />
              <span className="text-xs uppercase tracking-[0.18em] font-bold" style={{ color: T.teal }}>Command Center</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: T.primary }}>
              Good morning, {MERCHANT_INFO.name}
            </h1>
            <p className="mt-1.5 text-base max-w-xl" style={{ color: T.secondary }}>
              {insightsLoaded ? `${insights.length} AI insights loaded · Market Analyst active` : 'Loading insights...'}
            </p>
          </div>
          <Link to="/chat"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shrink-0 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${T.teal}, #0EA5E9)`, color: '#fff', boxShadow: `0 4px 24px rgba(45,212,191,0.28)` }}>
            Ask Co-Pilot <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-7">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest font-bold" style={{ color: T.muted }}>{card.label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: card.dim, color: card.accent }}>{card.icon}</div>
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tight" style={{ color: T.primary }}>{card.value}</div>
                  <div className="text-sm mt-1" style={{ color: T.secondary }}>{card.sub}</div>
                </div>
                <div className="h-0.5 rounded-full mt-auto" style={{ background: `linear-gradient(90deg, ${card.accent}55, transparent)` }} />
              </motion.div>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
            <div className="rounded-2xl p-6" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: T.primary }}>Market Analyst Insights</h2>
                <Link to="/map" className="text-sm font-semibold transition-opacity hover:opacity-80 flex items-center gap-1" style={{ color: T.teal }}>
                  View Map <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!insightsLoaded ? (
                <div className="rounded-xl p-5 text-sm" style={{ background: T.s2, border: `1px solid ${T.border}`, color: T.secondary }}>
                  <div className="flex items-center gap-2">
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full" style={{ background: T.teal, boxShadow: `0 0 6px ${T.teal}` }} />
                    Generating insights from Market Analyst...
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight: any, idx: number) => {
                    const acc = urgencyAccent(insight.urgency);
                    return (
                      <motion.div key={insight.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className="rounded-xl p-4" style={{ background: T.s2, border: `1px solid ${acc.border}` }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: acc.color, boxShadow: `0 0 7px ${acc.color}` }} />
                            {urgencyIcon(insight.urgency)}
                            <span className="text-xs uppercase tracking-widest font-bold truncate" style={{ color: T.muted }}>{insight.urgency}</span>
                          </div>
                          <Sparkles className="w-3 h-3" style={{ color: acc.color }} />
                        </div>

                        <h3 className="font-semibold text-base leading-snug" style={{ color: T.primary }}>{insight.headline}</h3>

                        <div className="mt-2 rounded-lg p-2.5 text-sm" style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.12)' }}>
                          <span className="font-bold text-[10px] uppercase" style={{ color: T.teal }}>Action: </span>
                          <span style={{ color: T.teal }}>{insight.action}</span>
                        </div>

                        {insight.steps && insight.steps.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {insight.steps.map((step: string, si: number) => (
                              <div key={si} className="flex items-start gap-2 text-xs" style={{ color: T.secondary }}>
                                <span className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: T.s3, color: T.muted }}>{si + 1}</span>
                                {step}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${T.border}`, color: T.secondary }}>
                          <span className="font-bold" style={{ color: T.muted }}>Why: </span>{insight.reasoning}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl p-5" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: T.primary }}>Signal Summary</h3>
                <div className="space-y-3.5">
                  {insights.slice(0, 7).map((ins: any) => {
                    const dotColor = ins.urgency === 'red' ? T.ruby : ins.urgency === 'amber' ? T.amber : T.teal;
                    return (
                      <div key={ins.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
                          style={{ background: T.s2, border: `1px solid ${T.borderMd}` }}>
                          {urgencyIcon(ins.urgency)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{ color: T.primary }}>{ins.headline}</p>
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: T.muted }}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                            {ins.urgency}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: T.primary }}>What Your AI Did</h3>
                <div className="space-y-3">
                  {[
                    `${insights.length} personal insights generated`,
                    '5 regional signals tracked across SEA',
                    '8 local signals within 5km radius',
                    'Intelligence Map synced with live data',
                    `${liveRecs.length} recommendation logs available`,
                  ].map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-2.5 text-sm" style={{ color: T.secondary }}>
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: T.teal }} />
                      {line}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <Link to="/map" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: T.teal }}>
                    View Intelligence Map <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
