import React, { useState } from 'react';
import { ListOrdered, Filter, CheckCircle2 } from 'lucide-react';
import { ALERTS } from '../data/mock';
import { cn } from '../lib/utils';

export default function Recommendations() {
  const [filter, setFilter] = useState('all');

  // Generating some historical mock data by cloning ALERTS and changing dates/status
  const historical = [
    ...ALERTS,
    { id: 'h1', agent: 'Inventory Planner', urgency: 'amber', headline: 'Tapioca Pearls below trigger threshold', detail: 'Stock dropping to 6 days. Standard delivery window is 3 days.', time: 'Last week', status: 'acted_on', note: 'Ordered 15kg via Whatsapp.' },
    { id: 'h2', agent: 'Market Analyst', urgency: 'green', headline: 'Taro Milk Tea stabilizing', detail: 'Demand has leveled off, maintaining current price is optimal.', time: '2 weeks ago', status: 'dismissed' },
    { id: 'h3', agent: 'Location Scout', urgency: 'amber', headline: 'Competitor closed 2 blocks away', detail: 'Boba Time on SS2 has permanently closed. Expect 10-15% spillover traffic this weekend.', time: '3 weeks ago', status: 'acted_on', note: 'Prepped extra pearls for weekend.' },
  ];

  const filtered = filter === 'all' ? historical : historical.filter(a => a.status === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200 flex justify-between items-end">
         <div>
            <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
              <ListOrdered className="w-4 h-4 mr-2" /> Accountability
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Recommendations Log</h1>
         </div>
         <div className="flex gap-2">
            {['all', 'pending', 'acted_on', 'dismissed'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={cn(
                   "px-4 py-2 rounded-lg text-sm font-medium capitalize",
                   filter === f ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                 )}
               >
                 {f.replace('_', ' ')}
               </button>
            ))}
         </div>
      </header>
      
      <div className="p-8 max-w-7xl mx-auto space-y-4">
         {filtered.map((item, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
               <div className="w-[120px] shrink-0">
                  <div className="text-xs font-mono text-neutral-500 mb-2">{item.time}</div>
                  <div className="flex items-center space-x-1.5">
                     <div className={cn("w-2 h-2 rounded-full", item.urgency === 'red' ? "bg-red-500" : item.urgency === 'amber' ? "bg-amber-500" : "bg-teal-500")} />
                     <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{item.agent}</span>
                  </div>
               </div>
               
               <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{item.headline}</h3>
                  <p className="text-sm text-neutral-600">{item.detail}</p>
                  
                  {('note' in item) && item.note && (
                     <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 mr-2 mt-0.5 shrink-0"/>
                        <span className="italic text-neutral-600">"{" "}{(item as any).note}{" "} "</span>
                     </div>
                  )}
               </div>

               <div className="w-[120px] shrink-0 text-right">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                    item.status === 'pending' ? "bg-amber-100 text-amber-800" : 
                    item.status === 'acted_on' ? "bg-teal-100 text-teal-800" : "bg-neutral-100 text-neutral-600"
                  )}>
                    {item.status.replace('_', ' ')}
                  </span>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
