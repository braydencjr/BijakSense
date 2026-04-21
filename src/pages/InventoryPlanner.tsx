import React from 'react';
import { INGREDIENTS } from '../data/mock';
import { Package, AlertTriangle, TrendingUp, Calendar, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const mockPriceHistory = (trend: 'flat' | 'up' | 'spike') => {
  return Array.from({ length: 30 }).map((_, i) => {
    let base = 100 + Math.random() * 5;
    if (trend === 'up') base += i * 1.5;
    if (trend === 'spike' && i > 25) base += (i - 25) * 8;
    return { value: base };
  });
};

export default function InventoryPlanner() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
        <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
          <Package className="w-4 h-4 mr-2" /> Agent: Inventory Planner
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Stock & Sourcing</h1>
      </header>
      
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Section: Table */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
             <h2 className="font-semibold">Current Stock Status</h2>
             <span className="text-xs text-neutral-500 font-mono">UPDATED: 2 HOURS AGO</span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 text-xs uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-3 font-semibold">Ingredient</th>
                   <th className="px-6 py-3 font-semibold">Supplier</th>
                   <th className="px-6 py-3 font-semibold">Stock Level (Days)</th>
                   <th className="px-6 py-3 font-semibold">Unit Price</th>
                   <th className="px-6 py-3 font-semibold">Market Trend</th>
                   <th className="px-6 py-3 text-right font-semibold">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-100">
                 {INGREDIENTS.map(item => {
                   const isCrit = item.stockDays <= item.reorderPoint;
                   const isAlert = item.alert;
                   
                   return (
                     <tr key={item.id} className={cn("hover:bg-neutral-50/50 transition-colors", isAlert ? "bg-red-50/30" : isCrit ? "bg-amber-50/30" : "")}>
                       <td className="px-6 py-4 font-medium flex items-center">
                         {isAlert && <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />}
                         {!isAlert && isCrit && <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />}
                         {item.name}
                       </td>
                       <td className="px-6 py-4 text-neutral-600">{item.supplier}</td>
                       <td className="px-6 py-4">
                         <div className="flex items-center">
                           <span className={cn("font-mono font-medium", isAlert || isCrit ? (isAlert ? "text-red-700" : "text-amber-700") : "text-neutral-700")}>
                             {item.stockDays}
                           </span>
                           <span className="text-neutral-400 ml-1 text-xs">/ {item.reorderPoint} reorder</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 font-mono text-neutral-700">RM {item.price.toFixed(2)}</td>
                       <td className="px-6 py-4">
                          {item.trend === 'flat' && <span className="text-neutral-500 flex items-center text-xs"><ArrowRight className="w-3 h-3 mr-1"/> Stable</span>}
                          {item.trend === 'up' && <span className="text-amber-600 flex items-center text-xs font-semibold"><ArrowUp className="w-3 h-3 mr-1"/> Rising</span>}
                          {item.trend === 'spike' && <span className="text-red-600 flex items-center text-xs font-bold"><ArrowUp className="w-3 h-3 mr-1"/> Spiking</span>}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button className={cn(
                           "px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
                           isAlert ? "bg-red-600 hover:bg-red-700 text-white" : isCrit ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                         )}>
                           {isCrit || isAlert ? 'ORDER NOW' : 'REVIEW'}
                         </button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Middle Section: Timeline */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200">
               <h2 className="font-semibold">Upcoming Recommended Actions</h2>
            </div>
            <div className="p-6 flex-1">
               <div className="relative border-l-2 border-neutral-100 ml-3 space-y-8">
                 <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]" />
                    <div className="text-xs font-bold text-red-600 mb-1">IMMEDIATE</div>
                    <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                       <h3 className="font-semibold mb-1">Restock Jasmine Rice (60kg)</h3>
                       <p className="text-sm text-neutral-600 mb-3">Est. cost: RM 2,520</p>
                       <div className="bg-red-50 text-red-800 text-xs p-2 rounded flex items-start">
                         <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                         Triggered by: Typhoon Haikui — Thai rice supply disruption forecast.
                       </div>
                    </div>
                 </div>
                 
                 <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-teal-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]" />
                    <div className="text-xs font-bold text-neutral-500 mb-1">IN 4 DAYS</div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                       <h3 className="font-semibold mb-1">Regular Restock: Fresh Milk, Pearls</h3>
                       <p className="text-sm text-neutral-600 mb-3">Est. cost: RM 1,140</p>
                       <div className="bg-neutral-50 text-neutral-600 text-xs p-2 rounded flex items-start border border-neutral-100">
                         <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                         Standard weekly resupply based on local projection.
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Bottom Section: Sparklines */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
               <h2 className="font-semibold">Key Ingredient Price Trends (90d)</h2>
            </div>
            <div className="p-6 space-y-6">
               {[
                 { name: "Jasmine Rice", trend: 'spike', current: "RM 42.00", color: "#ef4444" },
                 { name: "Brown Sugar Syrup", trend: 'up', current: "RM 55.00", color: "#f59e0b" },
                 { name: "Matcha Powder", trend: 'flat', current: "RM 120.00", color: "#14b8a6" },
               ].map((item, i) => (
                 <div key={i}>
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-medium text-sm text-neutral-700">{item.name}</span>
                     <span className="font-mono text-sm font-semibold">{item.current}</span>
                   </div>
                   <div className="h-16 w-full rounded overflow-hidden relative group cursor-crosshair">
                     <div className="absolute inset-y-0 right-[25%] border-l border-dashed border-neutral-300 z-10">
                        <div className="text-[9px] text-neutral-400 absolute -top-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">FORECAST</div>
                     </div>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPriceHistory(item.trend as any)}>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={item.color} 
                            fill={item.color} 
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
