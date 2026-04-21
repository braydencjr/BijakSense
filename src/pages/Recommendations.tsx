import React, { useState } from 'react';
import { ListOrdered, CheckCircle2 } from 'lucide-react';
import { ALERTS } from '../data/mock';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Recommendations() {
  const [filter, setFilter] = useState('all');

  const historical = [
    ...ALERTS,
    { id: 'h1', agent: 'Inventory Planner', urgency: 'amber', headline: 'Tapioca Pearls below trigger threshold', detail: 'Stock dropping to 6 days. Standard delivery window is 3 days.', time: 'Last week', status: 'acted_on', note: 'Ordered 15kg via Whatsapp.' },
    { id: 'h2', agent: 'Market Analyst', urgency: 'green', headline: 'Taro Milk Tea stabilizing', detail: 'Demand has leveled off, maintaining current price is optimal.', time: '2 weeks ago', status: 'dismissed' },
    { id: 'h3', agent: 'Location Scout', urgency: 'amber', headline: 'Competitor closed 2 blocks away', detail: 'Boba Time on SS2 has permanently closed. Expect 10-15% spillover traffic this weekend.', time: '3 weeks ago', status: 'acted_on', note: 'Prepped extra pearls for weekend.' },
  ];

  const filtered = filter === 'all' ? historical : historical.filter(a => a.status === filter);

  const urgencyColor = (u: string) => u === 'red' ? '#FF4B4B' : u === 'amber' ? '#FFB000' : '#00D1C1';
  const statusStyle = (s: string) => {
    if (s === 'pending') return { background: 'rgba(255,176,0,0.12)', color: '#FFB000', border: '1px solid rgba(255,176,0,0.2)' };
    if (s === 'acted_on') return { background: 'rgba(0,209,193,0.1)', color: '#00D1C1', border: '1px solid rgba(0,209,193,0.2)' };
    return { background: 'rgba(255,255,255,0.05)', color: '#4B5563', border: '1px solid rgba(255,255,255,0.08)' };
  };

  return (
    <div className="flex-1 overflow-y-auto h-full font-sans" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <header
        className="px-8 py-6 flex justify-between items-end shrink-0"
        style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
      >
        <div>
          <div className="flex items-center text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#4B5563' }}>
            <ListOrdered className="w-4 h-4 mr-2" /> Accountability
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#F8F9FA' }}>Recommendations Log</h1>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'acted_on', 'dismissed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={
                filter === f
                  ? { background: 'rgba(0,209,193,0.15)', color: '#00D1C1', border: '1px solid rgba(0,209,193,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-4">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id ?? i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-6"
            style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-[120px] shrink-0">
              <div className="text-xs font-mono mb-2" style={{ color: '#4B5563' }}>{item.time}</div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: urgencyColor(item.urgency), boxShadow: `0 0 6px ${urgencyColor(item.urgency)}` }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>{item.agent}</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1" style={{ color: '#F8F9FA' }}>{item.headline}</h3>
              <p className="text-sm" style={{ color: '#6B7280' }}>{item.detail}</p>

              {('note' in item) && item.note && (
                <div
                  className="mt-3 rounded-lg p-3 text-sm flex items-start"
                  style={{ background: 'rgba(0,209,193,0.06)', border: '1px solid rgba(0,209,193,0.15)' }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 shrink-0" style={{ color: '#00D1C1' }} />
                  <span className="italic" style={{ color: '#9CA3AF' }}>"{(item as any).note}"</span>
                </div>
              )}
            </div>

            <div className="w-[120px] shrink-0 text-right">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                style={statusStyle(item.status)}
              >
                {item.status.replace('_', ' ')}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
