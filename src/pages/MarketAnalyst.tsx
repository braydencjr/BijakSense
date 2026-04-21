import React from 'react';
import { MENU_ITEMS } from '../data/mock';
import { TrendingUp, Target, BarChart2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const DEMAND_DATA = [
  { week: 'W1 (Current)', classic: 120, boba: 150, matcha: 80, taro: 90, mango: 70 },
  { week: 'W2', classic: 125, boba: 145, matcha: 110, taro: 85, mango: 65 },
  { week: 'W3 (Holiday)', classic: 140, boba: 180, matcha: 140, taro: 100, mango: 90 },
  { week: 'W4', classic: 130, boba: 160, matcha: 165, taro: 95, mango: 75 },
];

export default function MarketAnalyst() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
        <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
          <TrendingUp className="w-4 h-4 mr-2" /> Agent: Market Analyst
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Market & Pricing Intel</h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Top: 2x2 Grid (Trend Radar) */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden p-6">
          <h2 className="font-semibold mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-neutral-400" />
            Trend Radar: Petaling Jaya (5km radius)
          </h2>

          <div className="relative w-full aspect-[21/9] bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center p-4">
            {/* Grid lines */}
            <div className="absolute inset-0">
               <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-neutral-300" />
               <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-neutral-300" />
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 text-xs font-bold text-neutral-400">Emerging Opportunity</div>
            <div className="absolute top-2 right-2 text-xs font-bold text-neutral-400">Established / High Growth</div>
            <div className="absolute bottom-2 left-2 text-xs font-bold text-neutral-400">Niche / Fading</div>
            <div className="absolute bottom-2 right-2 text-xs font-bold text-neutral-400">Saturated / Fading</div>
            
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase font-bold text-neutral-400 tracking-widest whitespace-nowrap">Trend Velocity</div>
            <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Market Saturation</div>

            {/* Bubbles */}
            <div className="absolute top-[20%] left-[25%] p-3 bg-teal-500/20 border border-teal-500 rounded-full flex items-center justify-center text-xs font-semibold text-teal-800 shadow-[0_0_20px_rgba(20,184,166,0.3)]">Matcha +38%</div>
            <div className="absolute bottom-[20%] right-[25%] p-4 bg-neutral-200 border border-neutral-400 rounded-full flex items-center justify-center text-xs font-semibold text-neutral-600">Brown Sugar</div>
            <div className="absolute top-[40%] right-[30%] p-2.5 bg-teal-500/10 border border-teal-400 rounded-full flex items-center justify-center text-xs font-semibold text-teal-700">Fruit Tea</div>
            <div className="absolute bottom-[30%] left-[30%] p-1.5 bg-neutral-200 border border-neutral-400 rounded-full flex items-center justify-center text-[10px] font-semibold text-neutral-600">Taro</div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Competitor Pricing Table */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
               <h2 className="font-semibold">Competitor Pricing Benchmark</h2>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider relative">
                   <tr>
                     <th className="px-6 py-3 font-semibold">Item</th>
                     <th className="px-6 py-3 font-semibold">Your Price</th>
                     <th className="px-6 py-3 font-semibold">Area Avg</th>
                     <th className="px-6 py-3 font-semibold">Variance</th>
                     <th className="px-6 py-3 font-semibold text-right">Advice</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-100">
                   {MENU_ITEMS.map((item, i) => {
                     const isUnderPriced = item.price < item.areaAvg;
                     const diff = Math.abs(item.price - item.areaAvg);
                     const pDiff = (diff / item.price) * 100;
                     const warn = isUnderPriced && pDiff > 10;

                     return (
                       <tr key={i} className={cn(warn ? "bg-amber-50/30" : "")}>
                         <td className="px-6 py-4 font-medium text-neutral-800">{item.name}</td>
                         <td className="px-6 py-4 font-mono">RM {item.price.toFixed(2)}</td>
                         <td className="px-6 py-4 font-mono text-neutral-500">RM {item.areaAvg.toFixed(2)}</td>
                         <td className="px-6 py-4">
                           {diff === 0 ? <span className="text-neutral-400">—</span> : (
                             <span className={cn("font-mono font-medium flex items-center", isUnderPriced ? "text-amber-600" : "text-neutral-500")}>
                               {isUnderPriced ? '-' : '+'}RM {diff.toFixed(2)}
                             </span>
                           )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {warn ? (
                             <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                               <AlertCircle className="w-3 h-3 mr-1" />
                               RAISE PRICE
                             </span>
                           ) : <span className="text-xs text-neutral-400 uppercase font-medium">Keep</span>}
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
            </div>
          </section>

          {/* Demand Forecast Chart */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
               <h2 className="font-semibold flex items-center">
                 <BarChart2 className="w-4 h-4 mr-2 text-neutral-400"/>
                 4-Week Demand Forecast
               </h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={DEMAND_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                     <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       cursor={{ fill: '#f5f5f5' }}
                     />
                     <Bar dataKey="matcha" name="Matcha" stackId="a" fill="#14b8a6" />
                     <Bar dataKey="classic" name="Classic" stackId="a" fill="#171717" />
                     <Bar dataKey="boba" name="Boba" stackId="a" fill="#d4d4d8" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               <div className="mt-4 bg-teal-50 border border-teal-100 p-4 rounded-lg flex items-start text-sm text-teal-800">
                  <div className="mr-3 mt-0.5">ℹ️</div>
                  <div>
                    <span className="font-semibold block mb-1">Growth inflection detected.</span>
                    We map a steep trajectory for Matcha through W3 and W4, compensating for slight fatigue in Classic lines. Schedule extra staff and ensure Matcha inventory is secured prior to W3 holiday demand.
                  </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
