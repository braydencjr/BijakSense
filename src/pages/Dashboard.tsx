import React from 'react';
import { ALERTS, WORLD_SIGNALS, INGREDIENTS, MERCHANT_INFO } from '../data/mock';
import { AlertTriangle, TrendingUp, Package, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const pendingAlerts = ALERTS.filter(a => a.status === 'pending');
  const criticalIngredients = INGREDIENTS.filter(i => i.alert || i.stockDays <= i.reorderPoint).slice(0, 3);
  const topSignals = WORLD_SIGNALS.slice(0, 3);

  return (
    <div className="flex-1 bg-neutral-50 h-full overflow-y-auto font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-teal-700">Command Center</p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Good morning, {MERCHANT_INFO.name}</h1>
            <p className="text-neutral-600 mt-2 max-w-2xl">
              We scanned regional news, commodities, and local demand signals. Here are the decisions that matter today.
            </p>
          </div>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Ask Co-Pilot
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">Decisions Today</div>
              <div className="text-3xl font-semibold text-neutral-900">{pendingAlerts.length}</div>
              <div className="text-sm text-neutral-600 mt-1">High-signal recommendations ready</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">Supply Risk</div>
              <div className="text-3xl font-semibold text-amber-700">Moderate</div>
              <div className="text-sm text-neutral-600 mt-1">{criticalIngredients.length} ingredients near threshold</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">Demand Opportunity</div>
              <div className="text-3xl font-semibold text-teal-700">+38%</div>
              <div className="text-sm text-neutral-600 mt-1">Matcha-related search lift in your area</div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Today’s Priority Decisions</h2>
                <Link to="/recommendations" className="text-sm text-teal-700 font-medium hover:underline">Open full action log</Link>
              </div>
              <div className="space-y-4">
                {pendingAlerts.map((alert) => (
                  <div key={alert.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          alert.urgency === 'red' ? 'bg-red-500' : alert.urgency === 'amber' ? 'bg-amber-500' : 'bg-teal-500'
                        )} />
                        <p className="text-xs uppercase tracking-wide font-semibold text-neutral-500">{alert.agent}</p>
                      </div>
                      <span className="text-xs text-neutral-500">{alert.time}</span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 mt-2">{alert.headline}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{alert.detail}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        AI confidence: high
                      </span>
                      <span>Estimated impact: RM 120-RM 420 this week</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold mb-3">Signal Summary</h3>
                <div className="space-y-3">
                  {topSignals.map((signal) => (
                    <div key={signal.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center mt-0.5">
                        {signal.type === 'Disruption' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {signal.type === 'Commodity' && <Package className="w-4 h-4 text-amber-600" />}
                        {signal.type === 'Trend' && <TrendingUp className="w-4 h-4 text-teal-600" />}
                        {signal.type !== 'Disruption' && signal.type !== 'Commodity' && signal.type !== 'Trend' && <Sparkles className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{signal.summary}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{signal.origin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold mb-3">What The AI Did</h3>
                <div className="space-y-2.5 text-sm text-neutral-700">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" />Ingested 128 regional signals in the last 6 hours</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" />Linked global disruptions to your ingredient costs</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" />Converted findings into merchant-ready actions</div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-100 text-sm">
                  <Link to="/map" className="inline-flex items-center gap-2 text-teal-700 font-medium hover:underline">
                    See source signals on Intelligence Map
                    <ArrowRight className="w-4 h-4" />
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
