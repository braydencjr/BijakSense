import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from '../lib/utils';
import { MERCHANT_INFO } from '../data/mock';

const ONBOARDING_COMPLETE_KEY = 'merchantmind:onboardingComplete';

// Fix Leaflet basic marker
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = () => {
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch {
      // Ignore storage failures and continue to app.
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex w-full h-full"
          >
            <div className="w-1/2 flex flex-col items-center justify-center p-16 z-10 bg-neutral-950">
              <div className="w-full max-w-md">
                <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center text-3xl font-bold mb-8 shadow-[0_0_40px_rgba(13,148,136,0.3)]">M</div>
                <h1 className="text-5xl font-medium tracking-tight mb-4 text-white">MerchantMind</h1>
                <p className="text-2xl text-neutral-400 font-light mb-12">The world is watching. So are we.</p>
                <button 
                  onClick={() => setStep(2)}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center"
                >
                  Get Started
                  <span className="ml-2">→</span>
                </button>
              </div>
            </div>
            <div className="w-1/2 relative bg-neutral-900 border-l border-neutral-800">
              {/* Fake Map element for step 1 visually */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/6/101.6/3.1.png')] bg-cover bg-center mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-transparent z-10" />
              
              {/* Animated dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_15px_#14b8a6]"
                  initial={{ 
                    top: `${20 + Math.random() * 60}%`, 
                    left: `${20 + Math.random() * 60}%`,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0.4, 0],
                    scale: [0, 1.5, 1, 0]
                  }}
                  transition={{ 
                    duration: 4 + Math.random() * 4, 
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex w-full h-full bg-neutral-50 text-neutral-900"
          >
             <div className="w-1/2 flex items-center justify-center p-12">
               <div className="w-full max-w-md space-y-6">
                 <div>
                   <h2 className="text-3xl font-semibold mb-2 text-neutral-900">Define your business</h2>
                   <p className="text-neutral-500">Provide the basics so MerchantMind can fine-tune its signals.</p>
                 </div>
                 
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium mb-1 text-neutral-700">Business Name</label>
                     <input type="text" className="w-full p-3 rounded-md border border-neutral-300 bg-white" defaultValue={MERCHANT_INFO.businessName} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-neutral-700">Sector</label>
                      <select className="w-full p-3 rounded-md border border-neutral-300 bg-white" defaultValue="F&B">
                        <option>F&B</option>
                        <option>Retail</option>
                        <option>Services</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-neutral-700">Sub-category</label>
                      <select className="w-full p-3 rounded-md border border-neutral-300 bg-white" defaultValue="Bubble Tea">
                        <option>Bubble Tea</option>
                        <option>Cafe</option>
                        <option>Restaurant</option>
                      </select>
                    </div>
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1 text-neutral-700">Primary Products (Tags)</label>
                      <div className="w-full p-3 rounded-md border border-neutral-300 bg-white flex flex-wrap gap-2">
                        <span className="bg-neutral-100 text-neutral-700 py-1 px-2 rounded text-sm">Milk Tea</span>
                        <span className="bg-neutral-100 text-neutral-700 py-1 px-2 rounded text-sm">Boba</span>
                        <span className="bg-neutral-100 text-neutral-700 py-1 px-2 rounded text-sm">Matcha</span>
                      </div>
                   </div>
                 </div>

                 <button onClick={() => setStep(3)} className="w-full bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-md font-medium mt-4">
                   Continue
                 </button>
               </div>
             </div>
             <div className="w-1/2 p-6">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative">
                  <MapContainer center={[3.1073, 101.6067]} zoom={11} className="w-full h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[3.1073, 101.6067]} />
                  </MapContainer>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-neutral-200 shadow-sm z-[1000] pointer-events-none">
                    <p className="font-medium text-sm">Location set: Petaling Jaya</p>
                  </div>
                </div>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex w-full h-full items-center justify-center bg-neutral-50"
          >
            <div className="max-w-2xl w-full text-neutral-900 border border-neutral-200 rounded-2xl bg-white p-10 shadow-sm">
              <h2 className="text-3xl font-semibold mb-2">Configure Inventory Tracking</h2>
              <p className="text-neutral-500 mb-8">We've identified the core commodities required for Bubble Tea. The Inventory Planner agent will track macro signals affecting these inputs.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  "Tapioca pearls",
                  "Jasmine tea",
                  "Fresh milk",
                  "Brown sugar syrup",
                  "Matcha powder",
                  "Disposable cups & lids"
                ].map((item, i) => (
                  <div key={item} className="flex items-center p-4 border border-teal-100 bg-teal-50/30 rounded-lg">
                    <div className="w-5 h-5 bg-teal-500 rounded flex items-center justify-center text-white mr-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
                <div className="flex items-center p-4 border border-dashed border-neutral-300 rounded-lg text-neutral-500 justify-center cursor-pointer hover:bg-neutral-50 transition-colors">
                  + Add ingredient
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-neutral-500 font-medium hover:text-neutral-900">Back</button>
                <button onClick={() => setStep(4)} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-md font-medium">Continue</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex w-full h-full flex-col items-center justify-center bg-[#f9faf9] text-neutral-900 p-8"
          >
            <h2 className="text-4xl font-semibold mb-3">Select your operational phase</h2>
            <p className="text-neutral-500 mb-12 text-lg">This determines which agents form your core team.</p>

            <div className="grid grid-cols-3 gap-6 max-w-5xl w-full">
              {[
                { phase: "Found", title: "I'm planning to open", desc: "For scouting locations, securing funding, and initial setup.", agents: ["Location Scout", "Market Analyst"] },
                { phase: "Run", title: "I'm up and running", desc: "Focuses on supply chain, daily operations, and margin optimization.", agents: ["Inventory Planner", "Ops Advisor", "Market Analyst"], default: true },
                { phase: "Grow", title: "I'm ready to expand", desc: "For franchise planning, multi-outlet management, and capital allocation.", agents: ["Location Scout", "Market Analyst", "Expansion Strategist"] },
              ].map((card) => (
                <div 
                  key={card.phase} 
                  className={cn(
                    "border rounded-xl p-6 cursor-pointer transition-all flex flex-col h-full bg-white relative",
                    card.default ? "border-teal-500 shadow-[0_0_0_2px_#14b8a6]" : "border-neutral-200 hover:border-neutral-300 shadow-sm"
                  )}
                >
                  {card.default && <div className="absolute -top-3 left-6 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Recommended</div>}
                  <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">{card.phase} Phase</div>
                  <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                  <p className="text-neutral-500 text-sm mb-8 flex-1">{card.desc}</p>
                  
                  <div className="mt-auto">
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 border-t pt-4 border-neutral-100">Active Agents</div>
                    <div className="flex flex-wrap gap-2">
                      {card.agents.map(a => (
                        <span key={a} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 w-full max-w-5xl flex justify-end">
               <button onClick={handleComplete} className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-md font-medium shadow-lg hover:shadow-xl transition-all">
                 Launch MerchantMind →
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
