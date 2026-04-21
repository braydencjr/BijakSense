import React from 'react';
import { ALERTS, WORLD_SIGNALS, INGREDIENTS, MERCHANT_INFO } from '../data/mock';
import {
  AlertTriangle, TrendingUp, Package, Sparkles, ArrowRight,
  CheckCircle2, Zap, BarChart2, ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

/* ─── Design tokens ──────────────────────────────────────────────
   Surface hierarchy (darkest → lightest):
     base    #09090F  — page background
     s1      #13141A  — primary card surface
     s2      #1C1D25  — elevated / inner surface
     s3      #24252F  — hover / active surface
   Borders:
     subtle  rgba(255,255,255,0.06)
     medium  rgba(255,255,255,0.11)
   Text:
     primary   #ECEEF2
     secondary #8B8FA8
     muted     #52556A
   Accents:
     teal    #2DD4BF  (CTA, active, positive)
     amber   #F59E0B  (warning)
     ruby    #F43F5E  (critical)
──────────────────────────────────────────────────────────────── */

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

function urgencyAccent(urgency: string) {
  if (urgency === 'red')   return { color: T.ruby,  dim: T.rubyDim,  border: 'rgba(244,63,94,0.22)' };
  if (urgency === 'amber') return { color: T.amber, dim: T.amberDim, border: 'rgba(245,158,11,0.2)' };
  return                          { color: T.teal,  dim: T.tealDim,  border: 'rgba(45,212,191,0.18)' };
}

export default function Dashboard() {
  const pendingAlerts       = ALERTS.filter(a => a.status === 'pending');
  const criticalIngredients = INGREDIENTS.filter(i => i.alert || i.stockDays <= i.reorderPoint).slice(0, 3);
  const topSignals          = WORLD_SIGNALS.slice(0, 3);

  const kpis = [
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Decisions Today',
      value: String(pendingAlerts.length),
      sub: 'High-signal actions ready',
      accent: T.teal,
      dim: T.tealDim,
    },
    {
      icon: <ShieldAlert className="w-4 h-4" />,
      label: 'Supply Risk',
      value: 'Moderate',
      sub: `${criticalIngredients.length} ingredients near threshold`,
      accent: T.amber,
      dim: T.amberDim,
    },
    {
      icon: <BarChart2 className="w-4 h-4" />,
      label: 'Demand Opportunity',
      value: '+38%',
      sub: 'Matcha search lift in your area',
      accent: T.teal,
      dim: T.tealDim,
    },
  ];

  return (
    <div
      className="flex-1 h-full overflow-y-auto font-sans"
      style={{ background: T.base, color: T.primary }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="px-8 py-5 shrink-0"
        style={{
          background: T.s1,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-1.5">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: T.teal, boxShadow: `0 0 6px ${T.teal}` }}
              />
              <span
                className="text-xs uppercase tracking-[0.18em] font-bold"
                style={{ color: T.teal }}
              >
                Command Center
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: T.primary }}>
              Good morning, {MERCHANT_INFO.name} 👋
            </h1>
            <p className="mt-1.5 text-base max-w-xl" style={{ color: T.secondary }}>
              {topSignals.length} new world signals scanned · {pendingAlerts.length} actions awaiting your decision
            </p>
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shrink-0 transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${T.teal}, #0EA5E9)`,
              color: '#fff',
              boxShadow: `0 4px 24px rgba(45,212,191,0.28)`,
            }}
          >
            Ask Co-Pilot
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-7">

          {/* ── KPI Cards ──────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: T.s1,
                  border: `1px solid ${T.border}`,
                }}
              >
                {/* Icon badge + label */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs uppercase tracking-widest font-bold"
                    style={{ color: T.muted }}
                  >
                    {card.label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: card.dim, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <div
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: T.primary }}
                  >
                    {card.value}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{ color: T.secondary }}
                  >
                    {card.sub}
                  </div>
                </div>

                {/* Accent bar */}
                <div
                  className="h-0.5 rounded-full mt-auto"
                  style={{ background: `linear-gradient(90deg, ${card.accent}55, transparent)` }}
                />
              </motion.div>
            ))}
          </section>

          {/* ── Main grid ──────────────────────────────────────── */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">

            {/* Priority Decisions */}
            <div
              className="rounded-2xl p-6"
              style={{ background: T.s1, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: T.primary }}>
                  Today's Priority Decisions
                </h2>
                <Link
                  to="/recommendations"
                  className="text-sm font-semibold transition-opacity hover:opacity-80 flex items-center gap-1"
                  style={{ color: T.teal }}
                >
                  Full log <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {pendingAlerts.map((alert, idx) => {
                  const acc = urgencyAccent(alert.urgency);
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.07 }}
                      className="rounded-xl p-4"
                      style={{
                        background: T.s2,
                        border: `1px solid ${acc.border}`,
                      }}
                    >
                      {/* Top row: dot + agent + time */}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: acc.color,
                              boxShadow: `0 0 7px ${acc.color}`,
                            }}
                          />
                          <span
                            className="text-xs uppercase tracking-widest font-bold truncate"
                            style={{ color: T.muted }}
                          >
                            {alert.agent}
                          </span>
                        </div>
                        <span className="text-xs shrink-0 font-mono" style={{ color: T.muted }}>
                          {alert.time}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3
                        className="font-semibold text-base leading-snug"
                        style={{ color: T.primary }}
                      >
                        {alert.headline}
                      </h3>

                      {/* Detail */}
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: T.secondary }}>
                        {alert.detail}
                      </p>

                      {/* Footer */}
                      <div
                        className="mt-3 pt-3 flex items-center gap-3 text-xs"
                        style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" style={{ color: T.teal }} />
                          AI confidence: high
                        </span>
                        <span>Est. impact: RM 120 – RM 420</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Signal Summary */}
              <div
                className="rounded-2xl p-5"
                style={{ background: T.s1, border: `1px solid ${T.border}` }}
              >
                <h3 className="text-base font-semibold mb-4" style={{ color: T.primary }}>
                  World Signal Summary
                </h3>
                <div className="space-y-3.5">
                  {topSignals.map(signal => {
                    const icon =
                      signal.type === 'Disruption' ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: T.ruby }}  /> :
                      signal.type === 'Commodity'  ? <Package       className="w-3.5 h-3.5" style={{ color: T.amber }} /> :
                      signal.type === 'Trend'      ? <TrendingUp    className="w-3.5 h-3.5" style={{ color: T.teal }}  /> :
                                                     <Sparkles      className="w-3.5 h-3.5" style={{ color: T.teal }}  />;

                    const dotColor =
                      signal.type === 'Disruption' ? T.ruby :
                      signal.type === 'Commodity'  ? T.amber : T.teal;

                    return (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
                          style={{ background: T.s2, border: `1px solid ${T.borderMd}` }}
                        >
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{ color: T.primary }}>
                            {signal.summary}
                          </p>
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: T.muted }}>
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ background: dotColor }}
                            />
                            {signal.origin}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What The AI Did */}
              <div
                className="rounded-2xl p-5"
                style={{ background: T.s1, border: `1px solid ${T.border}` }}
              >
                <h3 className="text-base font-semibold mb-4" style={{ color: T.primary }}>
                  What Your AI Did
                </h3>

                <div className="space-y-3">
                  {[
                    'Ingested 128 regional signals in the last 6 hours',
                    'Linked global disruptions to your ingredient costs',
                    'Converted findings into merchant-ready actions',
                  ].map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: T.secondary }}
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{ color: T.teal }}
                      />
                      {line}
                    </motion.div>
                  ))}
                </div>

                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: `1px solid ${T.border}` }}
                >
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ color: T.teal }}
                  >
                    View Intelligence Map
                    <ArrowRight className="w-3.5 h-3.5" />
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
