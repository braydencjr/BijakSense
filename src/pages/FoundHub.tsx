import React from 'react';
import { Building2, Search, MapPin, CheckSquare, BarChart } from 'lucide-react';

export default function FoundHub() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
         <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
           <Building2 className="w-4 h-4 mr-2" /> Pre-Launch Command
         </div>
         <h1 className="text-3xl font-semibold tracking-tight">Found Phase Hub</h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               {/* Location Shortlist */}
               <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
                    <h2 className="font-semibold">Location Shortlist</h2>
                  </div>
                  <div className="divide-y divide-neutral-100">
                     {[
                       { loc: "SS2 / Block B", score: 88, details: "High foot traffic. 3 competitors nearby. Rent: RM 4,500." },
                       { loc: "Section 14 / Hub", score: 92, details: "MRT 800m away opening in 14mo. Rent: RM 3,800 (-18% vs avg)." },
                       { loc: " Uptown / Central", score: 74, details: "Extreme saturation. High demand but massive competitor overlap." }
                     ].map((l, i) => (
                        <div key={i} className="p-5 flex items-center justify-between">
                           <div>
                             <h3 className="font-semibold mb-1">{l.loc}</h3>
                             <p className="text-sm text-neutral-500">{l.details}</p>
                           </div>
                           <div className="ml-4 flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50 border border-teal-100">
                             <div className="text-2xl font-bold text-teal-700 leading-none mb-1">{l.score}</div>
                             <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Score</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

               {/* Sector Viability */}
               <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="font-semibold flex items-center"><BarChart className="w-4 h-4 mr-2 text-neutral-400"/> Bubble Tea Sector Viability (Petaling Jaya)</h2>
                     <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded">STRONG POSITIVE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-neutral-50 rounded p-4 border border-neutral-100">
                       <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">Growth (3mo)</div>
                       <div className="text-xl font-semibold text-neutral-800">+12%</div>
                     </div>
                     <div className="bg-neutral-50 rounded p-4 border border-neutral-100">
                       <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">Comp. Density</div>
                       <div className="text-xl font-semibold text-neutral-800">High</div>
                     </div>
                     <div className="bg-neutral-50 rounded p-4 border border-neutral-100">
                       <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">Est. Setup</div>
                       <div className="text-xl font-semibold text-neutral-800">RM 45k+</div>
                     </div>
                  </div>
               </section>
            </div>

            {/* Right Sidebar - Checklist */}
            <div className="space-y-8">
               <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200">
                     <h2 className="font-semibold flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-neutral-400"/> Launch Checklist</h2>
                  </div>
                  <div className="p-4 space-y-3">
                     {[
                       { t: "SSM Business Registration", checked: true },
                       { t: "Premise Signboard License", checked: false },
                       { t: "Food Handling Certificate", checked: false },
                       { t: "Typhoid Vaccinations x3", checked: false },
                       { t: "Initial Supplier Contracts", checked: true },
                     ].map((task, i) => (
                        <div key={i} className="flex items-start">
                           <input type="checkbox" checked={task.checked} readOnly className="mt-1 w-4 h-4 text-teal-600 rounded border-neutral-300 pointer-events-none" />
                           <span className={`ml-3 text-sm ${task.checked ? 'text-neutral-400 line-through' : 'text-neutral-700 font-medium'}`}>{task.t}</span>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
         </div>
      </div>
    </div>
  );
}
