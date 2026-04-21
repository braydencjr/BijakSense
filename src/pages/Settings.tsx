import React from 'react';
import { Settings as SettingsIcon, Link2, User, Bell } from 'lucide-react';
import { MERCHANT_INFO } from '../data/mock';

export default function Settings() {
  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 h-full font-sans text-neutral-900">
      <header className="px-8 py-6 bg-white border-b border-neutral-200">
         <div className="flex items-center text-sm uppercase tracking-widest font-bold text-neutral-400 mb-1">
           <SettingsIcon className="w-4 h-4 mr-2" /> Configuration
         </div>
         <h1 className="text-3xl font-semibold tracking-tight">Profile & Preferences</h1>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8">
         {/* Business Profile */}
         <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center">
               <User className="w-4 h-4 mr-2 text-neutral-500" />
               <h2 className="font-semibold">Business Profile</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
               <div>
                 <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">Business Name</label>
                 <input type="text" className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none" defaultValue={MERCHANT_INFO.businessName} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">Location</label>
                 <input type="text" className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none" defaultValue={MERCHANT_INFO.location} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">Sector</label>
                 <input type="text" className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none" disabled defaultValue={MERCHANT_INFO.sector} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">Operational Phase</label>
                 <input type="text" className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none" disabled defaultValue="Run Phase" />
               </div>
            </div>
         </section>

         {/* Integrations */}
         <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center">
               <Link2 className="w-4 h-4 mr-2 text-neutral-500" />
               <h2 className="font-semibold">Connected Integrations</h2>
            </div>
            <div className="divide-y divide-neutral-100">
               {[
                 { name: "POS System (StoreHub / Loyverse)", connected: false },
                 { name: "Accounting Software (Xero)", connected: false },
                 { name: "Supplier Email Extraction", connected: false },
                 { name: "Bank Feed (Maybank / CIMB)", connected: false }
               ].map((int, i) => (
                 <div key={i} className="p-5 flex justify-between items-center">
                   <span className="font-medium">{int.name}</span>
                   <button className="text-sm font-semibold text-teal-600 border border-teal-200 px-4 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">Connect</button>
                 </div>
               ))}
            </div>
            <div className="p-4 bg-teal-50 border-t border-teal-100 text-sm text-teal-800">
               MerchantMind is currently running in <b>Simulation Mode</b>. Connect your POS or Bank account for real-time localized insights.
            </div>
         </section>

         {/* Notifications */}
         <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center">
               <Bell className="w-4 h-4 mr-2 text-neutral-500" />
               <h2 className="font-semibold">Alert Preferences</h2>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">WhatsApp Number</label>
                 <input type="text" className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none max-w-sm" placeholder="+60 1x-xxxxxxx" />
               </div>
               
               <div className="pt-4 border-t border-neutral-100">
                  <span className="block text-sm font-semibold mb-3">Send alerts directly to Whatsapp for:</span>
                  <div className="space-y-2">
                     <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" defaultChecked />
                        <span className="text-sm text-neutral-700">Urgent Disruptions (Red)</span>
                     </label>
                     <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" defaultChecked />
                        <span className="text-sm text-neutral-700">Market Opportunities (Amber)</span>
                     </label>
                     <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" />
                        <span className="text-sm text-neutral-700">Daily Digest (Morning)</span>
                     </label>
                  </div>
               </div>
            </div>
         </section>
      </div>
    </div>
  );
}
