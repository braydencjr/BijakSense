import React, { useState } from 'react';
import { PlayCircle, ShieldCheck, Check, Calendar, Users, DollarSign } from 'lucide-react';
import { MENU_ITEMS } from '../data/mock';
import { cn } from '../lib/utils';

export default function RunHub() {
  const [pricesUpdated, setPricesUpdated] = useState<Record<string, boolean>>({});

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
         <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
           <PlayCircle className="w-4 h-4 mr-2" /> Operations Command
         </div>
         <h1 className="text-3xl font-semibold tracking-tight">Run Phase Hub</h1>
      </header>
      
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Weekly Restock Planner */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-white">
              <h2 className="font-semibold flex items-center"><Calendar className="w-4 h-4 mr-2 text-neutral-400"/> This Week's Restock Events</h2>
           </div>
           
           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 {/* Event 1 */}
                 <div className="border border-red-200 bg-red-50/50 rounded-xl p-4">
                    <div className="text-xs font-bold text-red-600 mb-2">URGENT • DISRUPTION RISK</div>
                    <h3 className="font-semibold mb-1">TeaBros Wholesale</h3>
                    <p className="text-sm text-neutral-600 mb-4">60kg Jasmine Rice, 10kg Tapioca Pearls</p>
                    <div className="flex justify-between items-end">
                       <span className="font-mono font-medium text-neutral-700">Est. RM 2,520</span>
                       <button className="bg-white border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-700 rounded shadow-sm hover:bg-neutral-50 transition-colors">CONFIRM ORDER</button>
                    </div>
                 </div>

                 {/* Event 2 */}
                 <div className="border border-neutral-200 bg-white rounded-xl p-4 opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-neutral-50/80 z-10 flex items-center justify-center">
                       <span className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-neutral-600 flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600"/> CONFIRMED</span>
                    </div>
                    <div className="text-xs font-bold text-neutral-400 mb-2">SCHEDULED • TUESDAY</div>
                    <h3 className="font-semibold mb-1">PJ Dairy Farm</h3>
                    <p className="text-sm text-neutral-600 mb-4">Weekly Fresh Milk (40L)</p>
                    <div className="flex justify-between items-end">
                       <span className="font-mono font-medium text-neutral-700">Est. RM 340</span>
                    </div>
                 </div>
              </div>
           </div>
           <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-sm font-medium text-neutral-600 flex justify-between">
              <span>Total Procurement Est:</span>
              <span className="font-mono text-neutral-900">RM 2,860.00</span>
           </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           {/* Pricing Review */}
           <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="font-semibold flex items-center"><DollarSign className="w-4 h-4 mr-2 text-neutral-400"/> Price Optimization Review</h2>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Item</th>
                    <th className="px-6 py-3 font-semibold text-center">Current</th>
                    <th className="px-6 py-3 font-semibold text-center">Suggested</th>
                    <th className="px-6 py-3 font-semibold text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {MENU_ITEMS.map((item, i) => {
                     const isUnderPriced = item.price < item.areaAvg;
                     const suggested = isUnderPriced ? Number((item.price + 1.0).toFixed(2)) : item.price;
                     if (!isUnderPriced) return null;

                     const updated = pricesUpdated[item.id];

                     return (
                        <tr key={i} className={updated ? "bg-teal-50/30" : ""}>
                           <td className="px-6 py-4 font-medium">{item.name}</td>
                           <td className="px-6 py-4 font-mono text-center text-neutral-500 line-through">RM {item.price.toFixed(2)}</td>
                           <td className="px-6 py-4 font-mono text-center font-semibold text-teal-700">RM {suggested.toFixed(2)}</td>
                           <td className="px-6 py-4 text-right">
                              {updated ? (
                                 <span className="inline-flex items-center text-xs font-bold text-teal-700">
                                   <Check className="w-3.5 h-3.5 mr-1" /> APPLIED
                                 </span>
                              ) : (
                                 <button 
                                   onClick={() => setPricesUpdated(prev => ({ ...prev, [item.id]: true }))}
                                   className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                 >
                                    APPLY UPDATE
                                 </button>
                              )}
                           </td>
                        </tr>
                     )
                  })}
                </tbody>
             </table>
             <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-sm">
                <span className="text-neutral-500">Estimated Monthly Impact: </span>
                <span className="font-mono font-medium text-teal-700">+RM 450.00</span>
             </div>
           </section>

           {/* Staffing */}
           <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                <h2 className="font-semibold flex items-center"><Users className="w-4 h-4 mr-2 text-neutral-400"/> Weekly Schedule Guideline</h2>
             </div>
             
             <div className="p-6">
                <div className="flex flex-col space-y-3">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat (Holiday)', 'Sun'].map((day, i) => {
                      const isHoliday = day.includes('Holiday');
                      return (
                         <div key={day} className="flex items-center">
                            <div className={cn("w-24 text-sm font-semibold", isHoliday ? "text-amber-600" : "text-neutral-500")}>{day}</div>
                            <div className="flex-1 flex gap-2 h-10">
                               <div className="flex-1 rounded-l-md border border-neutral-200 bg-neutral-50 flex items-center justify-center text-xs text-neutral-500 font-medium">AM: 2</div>
                               <div className={cn(
                                 "flex-1 rounded-r-md border flex items-center justify-center text-xs font-medium",
                                 isHoliday ? "border-amber-300 bg-amber-100 text-amber-800 shadow-inner" : "border-neutral-200 bg-neutral-50 text-neutral-500"
                               )}>
                                 PM: {isHoliday ? '4 (Surge)' : '3'}
                               </div>
                            </div>
                         </div>
                      )
                   })}
                </div>
                
                {/* Ops Note */}
                <div className="mt-6 bg-neutral-50 border border-neutral-200 p-4 rounded-lg flex items-start text-sm text-neutral-700">
                  <div className="mr-3 mt-0.5">ℹ️</div>
                  <div>
                    <span className="font-semibold block mb-1">Saturday Football Match</span>
                    Anticipated 2.1x traffic multiplier between 2 PM and 6 PM. We have updated the PM shift recommendation to 4 staff.
                  </div>
               </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
