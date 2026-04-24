import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Sparkles, MapPin, Building2, Search, ArrowRight, CheckCircle2, TrendingUp, Users, Zap, Store, Coffee, ShoppingBag, Utensils, Briefcase, Star, ChevronRight } from 'lucide-react';

// Fix Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom glowing pin icon
const glowIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:radial-gradient(circle,#00D1C1 0%,#00BCAE 60%,transparent 100%);
    box-shadow:0 0 20px 8px rgba(0,209,193,0.5);
    border:2px solid #00D1C1;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ───────────────────────────────── Types ─────────────────────────────────
type OnboardingPath = 'has_business' | 'exploring';

interface BusinessForm {
  businessName: string;
  businessType: string;
  location: string;
  budget: string;
}

interface ExploringForm {
  location: string;
  budget: string;
}

interface Coords { lat: number; lng: number; }

interface AISuggestion {
  icon: React.ReactNode;
  name: string;
  score: number;
  reason: string;
  tags: string[];
}

interface AIInsight {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}

// ───────────────────────── Business Types Catalogue ──────────────────────
const BUSINESS_TYPES = [
  'F&B — Bubble Tea / Drinks',
  'F&B — Café / Coffee',
  'F&B — Restaurant / Hawker',
  'F&B — Bakery / Pastry',
  'Retail — Fashion / Apparel',
  'Retail — Electronics / Gadgets',
  'Retail — Grocery / Minimart',
  'Services — Laundry / Dry Cleaning',
  'Services — Health & Beauty Salon',
  'Services — Tutoring / Education',
  'Services — Printing / Stationery',
  'Services — Logistics / Delivery',
];

// ──────────────────────── Nominatim Geocoding ────────────────────────────
async function geocodeLocation(location: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Malaysia')}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {/* fallback to default */}
  return null;
}

// ──────────────────────── Mock AI Generator ─────────────────────────────
function generateExploringSuggestions(location: string, budget: string): AISuggestion[] {
  const budgetNum = parseInt(budget || '30000');
  return [
    {
      icon: <Coffee className="w-5 h-5" />,
      name: 'Bubble Tea / Specialty Drinks',
      score: 91,
      reason: `High foot traffic demand in ${location}. Low startup cost vs. revenue potential. Matcha & fruit tea trending +38% regionally. 5km area shows gap in premium drink offerings.`,
      tags: ['Trending', 'Low Barrier', 'High Margin'],
    },
    {
      icon: <Utensils className="w-5 h-5" />,
      name: 'Hawker Stall / Local F&B',
      score: 78,
      reason: `Consistent demand from office workers and residents. ${budgetNum >= 20000 ? 'Your budget suits a food court or hawker slot well.' : 'Budget-friendly format to start.'} Local cuisine remains recession-resilient.`,
      tags: ['Stable Demand', 'Community', 'Recession-proof'],
    },
    {
      icon: <Store className="w-5 h-5" />,
      name: 'Minimart / Convenience Retail',
      score: 67,
      reason: `Residential density in ${location} creates steady walk-in traffic. Monthly subscription model (water, snacks) builds recurring revenue. Moderate competition observed within 5km.`,
      tags: ['Recurring Revenue', 'Residential', 'Essential'],
    },
  ];
}

function generateBusinessInsights(businessName: string, businessType: string, location: string): AIInsight[] {
  return [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Demand Signal',
      value: 'Strong ↑ +38%',
      detail: `Search volume for ${businessType.split('—')[1]?.trim() ?? businessType} in ${location} trending upward over 30 days. Early movers advantage still available.`,
      color: 'teal',
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: 'Competition Density',
      value: '4 nearby',
      detail: `Scan found 4 direct competitors within 5km of ${location}. Moderate — differentiation through quality or loyalty program recommended.`,
      color: 'amber',
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Top Opportunity',
      value: 'Peak Hour Gap',
      detail: `Late afternoon 3–6pm shows low supply coverage near your target zone. ${businessName} could capture commuter/school-out traffic with targeted promotions.`,
      color: 'teal',
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: 'Location Score',
      value: '82 / 100',
      detail: `${location} scores well on foot traffic proximity, public transport access, and residential density. Above regional average for new SME viability.`,
      color: 'teal',
    },
  ];
}

// ─────────────────── Animated Scan Status Text Component ─────────────────
const scanMessages = [
  '📡 Connecting to regional signals...',
  '🗺️  Scanning 5 km radius...',
  '🏪 Detecting nearby businesses...',
  '📊 Reading foot traffic patterns...',
  '🌏 Cross-referencing SEA market data...',
  '📈 Analyzing demand trends...',
  '🧠 Consulting AI business brain...',
  '✨ Generating insights...',
];

function ScanStatusTicker() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex(i => (i + 1) % scanMessages.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={msgIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="text-teal-300 text-sm font-medium font-mono"
      >
        {scanMessages[msgIndex]}
      </motion.p>
    </AnimatePresence>
  );
}

// ─────────────────────── Leaflet Fly-To Helper ───────────────────────────
function MapFlyTo({ coords }: { coords: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], 14, { duration: 2.2 });
  }, [coords, map]);
  return null;
}

// ──────────────────────── Pulsing Sonar Ring ─────────────────────────────
function SonarRing({ coords }: { coords: Coords }) {
  return (
    <Circle
      center={[coords.lat, coords.lng]}
      radius={5000}
      pathOptions={{
        color: '#00D1C1',
        fillColor: '#00D1C1',
        fillOpacity: 0.07,
        weight: 2,
        opacity: 0.6,
        dashArray: '6 4',
      }}
    />
  );
}

// ─────────────────────────── Floating Nodes ──────────────────────────────
const NODE_POSITIONS = [
  { top: '18%', left: '22%' }, { top: '42%', left: '68%' },
  { top: '70%', left: '35%' }, { top: '28%', left: '78%' },
  { top: '80%', left: '72%' }, { top: '55%', left: '18%' },
  { top: '12%', left: '55%' }, { top: '62%', left: '50%' },
];

function BackgroundNodes() {
  return (
    <>
      {NODE_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ top: pos.top, left: pos.left }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0.3, 0], scale: [0, 1.4, 1, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.6 }}
        >
          <div className="w-3 h-3 rounded-full bg-teal-500" style={{ boxShadow: '0 0 12px 4px rgba(0,209,193,0.5)' }} />
        </motion.div>
      ))}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//                          MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
type Stage = 'splash' | 'decision' | 'form' | 'analyzing' | 'results';

interface OnboardingProps {
  onComplete?: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('splash');
  const [path, setPath] = useState<OnboardingPath | null>(null);

  const [businessForm, setBusinessForm] = useState<BusinessForm>({
    businessName: '', businessType: BUSINESS_TYPES[0], location: '', budget: '',
  });
  const [exploringForm, setExploringForm] = useState<ExploringForm>({
    location: '', budget: '',
  });

  const [coords, setCoords] = useState<Coords>({ lat: 3.1073, lng: 101.6067 });
  const [pinDropped, setPinDropped] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scatterDots, setScatterDots] = useState<{ lat: number; lng: number }[]>([]);

  // Results
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const mapRef = useRef<L.Map | null>(null);

  // ─── Scan animation driver ────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'analyzing') return;

    const loc = path === 'has_business' ? businessForm.location : exploringForm.location;
    const budget = path === 'has_business' ? businessForm.budget : exploringForm.budget;

    // Geocode first
    geocodeLocation(loc).then(result => {
      const finalCoords = result ?? { lat: 3.1073, lng: 101.6067 };
      setCoords(finalCoords);

      // After fly-in settles, drop pin + scatter dots
      setTimeout(() => {
        setPinDropped(true);

        // Scatter competitor dots
        const dots = Array.from({ length: 6 }, (_, i) => ({
          lat: finalCoords.lat + (Math.random() - 0.5) * 0.07,
          lng: finalCoords.lng + (Math.random() - 0.5) * 0.07,
        }));
        setScatterDots(dots);
      }, 2600);

      // Progress bar
      const progressTimer = setInterval(() => {
        setScanProgress(p => {
          if (p >= 100) { clearInterval(progressTimer); return 100; }
          return p + (p < 80 ? 1.8 : 0.5);
        });
      }, 90);

      // After analysis complete, generate results and show
      setTimeout(() => {
        if (path === 'exploring') {
          setSuggestions(generateExploringSuggestions(loc, budget));
        } else {
          setInsights(generateBusinessInsights(businessForm.businessName, businessForm.businessType, loc));
        }
        setScanProgress(100);
        setTimeout(() => setStage('results'), 600);
      }, 9500);
    });
  }, [stage]);

  // ─── Save to localStorage + navigate ─────────────────────────────────
  function handleStart() {
    const loc = path === 'has_business' ? businessForm.location : exploringForm.location;
    const budget = path === 'has_business' ? businessForm.budget : exploringForm.budget;
    const data = {
      path,
      businessName: path === 'has_business' ? businessForm.businessName : 'My Business',
      businessType: path === 'has_business' ? businessForm.businessType : suggestions[0]?.name ?? 'F&B',
      location: loc,
      budget,
      coordinates: coords,
      aiInsights: path === 'has_business' ? insights : suggestions,
      onboardedAt: new Date().toISOString(),
    };
    localStorage.setItem('bijaksense:business', JSON.stringify(data));
    localStorage.setItem('bijaksense:onboardingComplete', 'true');
    onComplete?.();   // flip App-level state so routes re-evaluate
    navigate('/dashboard');
  }

  // ─── Form validation ──────────────────────────────────────────────────
  function canSubmitForm() {
    if (path === 'has_business') {
      return businessForm.businessName.trim() && businessForm.location.trim();
    }
    return exploringForm.location.trim().length > 0;
  }

  function handleFormSubmit() {
    if (!canSubmitForm()) return;
    setPinDropped(false);
    setScanProgress(0);
    setScatterDots([]);
    setStage('analyzing');
  }

  // ─────────────────────────── RENDER ──────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white overflow-hidden" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <AnimatePresence mode="wait">

        {/* ╔══════════════ STAGE: SPLASH ══════════════╗ */}
        {stage === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5 }}
            className="relative flex w-full h-full"
          >
            {/* Left pane */}
            <div className="w-1/2 flex flex-col items-center justify-center p-16 z-10">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold mb-8"
                  style={{ background: 'linear-gradient(135deg,#00D1C1,#00BCAE)', boxShadow: '0 0 40px rgba(0,209,193,0.35)' }}
                >
                  B
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-5xl font-semibold tracking-tight mb-4"
                >
                  BijakSense
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl mb-3"
                  style={{ color: '#9CA3AF' }}
                >
                  The world is watching. So are we.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="text-sm mb-12 leading-relaxed"
                  style={{ color: '#4B5563' }}
                >
                  Your AI-powered business co-pilot for SEA. Market signals, demand trends,
                  and supply chain intelligence — translated into plain-language decisions.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStage('decision')}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                  style={{ background: 'linear-gradient(135deg,#00D1C1,#00BCAE)', boxShadow: '0 0 30px rgba(0,209,193,0.3)' }}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Right pane — animated dark map bg */}
            <div className="w-1/2 relative" style={{ background: '#0D1117' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(0,209,193,0.08) 0%, transparent 65%)' }} />
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,209,193,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,193,0.3) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}>
              </div>
              <BackgroundNodes />
              {/* Gradient fade from left */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0D0D0D 0%, transparent 40%)' }} />

              {/* Corner label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 right-8 text-right"
              >
                <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: '#00D1C1' }}>Live Intelligence</p>
                <p className="text-xs mt-1" style={{ color: '#4B5563' }}>SEA Region · Real-time signals</p>
              </motion.div>

              {/* Floating signal chips */}
              {[
                { label: '📈 Matcha demand +38%', top: '20%', right: '8%', delay: 1.0 },
                { label: '⚠️  Rice supply disruption', top: '40%', right: '5%', delay: 1.3 },
                { label: '🔗 Port Klang delay +3d', top: '60%', right: '10%', delay: 1.6 },
              ].map((chip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: chip.delay, duration: 0.5 }}
                  className="absolute px-3 py-2 rounded-lg text-xs font-medium border"
                  style={{
                    top: chip.top, right: chip.right,
                    background: 'rgba(13,13,13,0.85)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(0,209,193,0.25)',
                    color: '#9CA3AF',
                  }}
                >
                  {chip.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ╔══════════════ STAGE: DECISION ══════════════╗ */}
        {stage === 'decision' && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45 }}
            className="flex w-full h-full flex-col items-center justify-center p-8"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,209,193,0.06) 0%, transparent 60%), #0D0D0D' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-semibold tracking-widest uppercase"
                style={{ borderColor: 'rgba(0,209,193,0.3)', color: '#00D1C1', background: 'rgba(0,209,193,0.06)' }}>
                <Sparkles className="w-3.5 h-3.5" /> AI Setup
              </div>
              <h2 className="text-4xl font-semibold tracking-tight mb-4">
                Do you already have a business in mind?
              </h2>
              <p style={{ color: '#6B7280' }} className="text-lg">
                BijakSense will tailor its AI analysis based on your answer.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
              {/* YES card */}
              <motion.button
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setPath('has_business'); setStage('form'); }}
                className="flex flex-col items-start p-8 rounded-2xl border text-left transition-all group"
                style={{
                  borderColor: 'rgba(0,209,193,0.25)',
                  background: 'rgba(0,209,193,0.04)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(0,209,193,0.15)', border: '1px solid rgba(0,209,193,0.3)' }}>
                  <Building2 className="w-6 h-6" style={{ color: '#00D1C1' }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Yes, I have a business</h3>
                <p style={{ color: '#6B7280' }} className="text-sm leading-relaxed">
                  You've chosen a business name, type, and location. Get personalized insights for your specific venture.
                </p>
                <div className="flex items-center gap-1.5 mt-5 text-sm font-medium" style={{ color: '#00D1C1' }}>
                  Set up my business <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>

              {/* EXPLORE card */}
              <motion.button
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setPath('exploring'); setStage('form'); }}
                className="flex flex-col items-start p-8 rounded-2xl border text-left transition-all group"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Search className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Help me find one</h3>
                <p style={{ color: '#6B7280' }} className="text-sm leading-relaxed">
                  Not sure yet? Tell us your location and budget. AI will scan the area and suggest the best business opportunities for you.
                </p>
                <div className="flex items-center gap-1.5 mt-5 text-sm font-medium" style={{ color: '#9CA3AF' }}>
                  Explore opportunities <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ╔══════════════ STAGE: FORM ══════════════╗ */}
        {stage === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45 }}
            className="flex w-full h-full"
          >
            {/* Left — form */}
            <div className="w-1/2 flex flex-col justify-center p-16"
              style={{ background: '#0D0D0D', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-full max-w-md">
                <button
                  onClick={() => setStage('decision')}
                  className="flex items-center gap-2 text-sm mb-8 transition-colors"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >
                  ← Back
                </button>

                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
                  style={{ borderColor: 'rgba(0,209,193,0.3)', color: '#00D1C1', background: 'rgba(0,209,193,0.06)' }}>
                  {path === 'has_business' ? <Building2 className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                  {path === 'has_business' ? 'Your Business' : 'Explore Mode'}
                </div>

                <h2 className="text-3xl font-semibold mb-2">
                  {path === 'has_business' ? 'Tell us about your business' : 'Where are you looking?'}
                </h2>
                <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
                  {path === 'has_business'
                    ? 'We\'ll analyze your market, competition, and best opportunities nearby.'
                    : 'Enter your target location and we\'ll find the best business types for that area.'}
                </p>

                <div className="space-y-5">
                  {path === 'has_business' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                          Business Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Siti's Bubble Tea"
                          value={businessForm.businessName}
                          onChange={e => setBusinessForm(f => ({ ...f, businessName: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-neutral-600"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#F8F9FA',
                          }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(0,209,193,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,209,193,0.1)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                          Business Type *
                        </label>
                        <select
                          value={businessForm.businessType}
                          onChange={e => setBusinessForm(f => ({ ...f, businessType: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#F8F9FA',
                          }}
                        >
                          {BUSINESS_TYPES.map(t => <option key={t} value={t} style={{ background: '#1A1A1A' }}>{t}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                      Location / Area *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Petaling Jaya, Selangor"
                      value={path === 'has_business' ? businessForm.location : exploringForm.location}
                      onChange={e => {
                        if (path === 'has_business') setBusinessForm(f => ({ ...f, location: e.target.value }));
                        else setExploringForm(f => ({ ...f, location: e.target.value }));
                      }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-neutral-600"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F8F9FA',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(0,209,193,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,209,193,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                      Monthly Budget (RM) <span style={{ color: '#4B5563' }}>— optional</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 30000"
                      value={path === 'has_business' ? businessForm.budget : exploringForm.budget}
                      onChange={e => {
                        if (path === 'has_business') setBusinessForm(f => ({ ...f, budget: e.target.value }));
                        else setExploringForm(f => ({ ...f, budget: e.target.value }));
                      }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-neutral-600"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F8F9FA',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(0,209,193,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,209,193,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <motion.button
                    whileHover={canSubmitForm() ? { scale: 1.02 } : {}}
                    whileTap={canSubmitForm() ? { scale: 0.98 } : {}}
                    onClick={handleFormSubmit}
                    disabled={!canSubmitForm()}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all mt-2"
                    style={{
                      background: canSubmitForm()
                        ? 'linear-gradient(135deg,#00D1C1,#00BCAE)'
                        : 'rgba(255,255,255,0.05)',
                      color: canSubmitForm() ? '#fff' : '#4B5563',
                      cursor: canSubmitForm() ? 'pointer' : 'not-allowed',
                      boxShadow: canSubmitForm() ? '0 0 24px rgba(0,209,193,0.25)' : 'none',
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                    {path === 'has_business' ? 'Analyze My Business Area' : 'Scan for Opportunities'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right — decorative map preview */}
            <div className="w-1/2 relative overflow-hidden" style={{ background: '#111318' }}>
              <div className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,209,193,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,193,0.05) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,209,193,0.1)', border: '2px solid rgba(0,209,193,0.3)' }}
                >
                  <MapPin className="w-10 h-10" style={{ color: '#00D1C1' }} />
                </motion.div>
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                  {path === 'has_business' ? 'Ready to pin your location' : 'Ready to scan your area'}
                </p>
                <p className="text-xs" style={{ color: '#374151' }}>
                  AI will scan within 5 km radius
                </p>
              </div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, #0D0D0D)' }} />
            </div>
          </motion.div>
        )}

        {/* ╔══════════════ STAGE: ANALYZING ══════════════╗ */}
        {stage === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex w-full h-full"
          >
            {/* Map takes full right/main area */}
            <div className="w-3/5 h-full relative">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={11}
                className="w-full h-full"
                zoomControl={false}
                ref={mapRef}
                style={{ background: '#111318' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CartoDB'
                />
                <MapFlyTo coords={coords} />

                {/* Sonar ring */}
                {pinDropped && (
                  <SonarRing coords={coords} />
                )}

                {/* Main pin */}
                {pinDropped && (
                  <Marker position={[coords.lat, coords.lng]} icon={glowIcon} />
                )}

                {/* Scatter competitor dots */}
                {scatterDots.map((dot, i) => (
                  <Marker
                    key={i}
                    position={[dot.lat, dot.lng]}
                    icon={L.divIcon({
                      className: '',
                      html: `<div style="
                        width:10px;height:10px;border-radius:50%;
                        background:#FFB000;
                        border:1.5px solid rgba(255,176,0,0.6);
                        box-shadow:0 0 8px rgba(255,176,0,0.4);
                      "></div>`,
                      iconSize: [10, 10],
                      iconAnchor: [5, 5],
                    })}
                  />
                ))}
              </MapContainer>

              {/* Sonar pulse overlay animation */}
              {pinDropped && (
                <>
                  {[1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        border: '1.5px solid rgba(0,209,193,0.4)',
                      }}
                      initial={{ width: 40, height: 40, opacity: 0.8 }}
                      animate={{ width: 280, height: 280, opacity: 0 }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: ring * 0.8, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}

              {/* Map overlay label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.8 }}
                className="absolute top-4 left-4 z-[1000] px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: 'rgba(13,13,13,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,209,193,0.2)',
                  color: '#00D1C1',
                }}
              >
                📍 {path === 'has_business' ? businessForm.location : exploringForm.location}
              </motion.div>

              {/* Scatter legend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
                className="absolute bottom-4 left-4 z-[1000] px-3 py-2.5 rounded-lg text-xs"
                style={{
                  background: 'rgba(13,13,13,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#9CA3AF',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#00D1C1', boxShadow: '0 0 6px rgba(0,209,193,0.6)' }} />
                  Your location
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#FFB000' }} />
                  Nearby businesses
                </div>
              </motion.div>
            </div>

            {/* Right sidebar — status */}
            <div className="w-2/5 h-full flex flex-col justify-center px-10"
              style={{ background: '#0D0D0D', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

              {/* AI thinking orb */}
              <div className="flex justify-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle, rgba(0,209,193,0.2) 0%, rgba(0,209,193,0.05) 60%, transparent 100%)' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-1 rounded-full"
                    style={{ border: '2px solid transparent', borderTopColor: '#00D1C1', borderRightColor: 'rgba(0,209,193,0.3)' }}
                  />
                  <Sparkles className="w-8 h-8" style={{ color: '#00D1C1' }} />
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Scanning your area</h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  BijakSense AI is analyzing the 5 km radius around your location.
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2" style={{ color: '#6B7280' }}>
                  <span>Analysis progress</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${scanProgress}%`,
                      background: 'linear-gradient(90deg, #00D1C1, #00BCAE)',
                      boxShadow: '0 0 10px rgba(0,209,193,0.4)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Status ticker */}
              <div className="px-4 py-3 rounded-xl text-center mb-6"
                style={{ background: 'rgba(0,209,193,0.04)', border: '1px solid rgba(0,209,193,0.15)' }}>
                <ScanStatusTicker />
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                {[
                  { label: 'Location pinned', done: pinDropped },
                  { label: '5 km radius scanned', done: scanProgress > 35 },
                  { label: 'Competitor map built', done: scatterDots.length > 0 },
                  { label: 'AI model running', done: scanProgress > 65 },
                  { label: 'Insights ready', done: scanProgress >= 100 },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <AnimatePresence mode="wait">
                      {step.done ? (
                        <motion.div
                          key="done"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00D1C1' }} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pending"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-4 h-4 rounded-full border flex-shrink-0"
                          style={{ borderColor: '#374151' }}
                        />
                      )}
                    </AnimatePresence>
                    <span style={{ color: step.done ? '#E5E7EB' : '#4B5563' }}>{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ╔══════════════ STAGE: RESULTS ══════════════╗ */}
        {stage === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="flex w-full h-full overflow-hidden"
          >
            {/* Left — small map stays */}
            <div className="w-2/5 h-full relative">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={14}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#111318' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <SonarRing coords={coords} />
                <Marker position={[coords.lat, coords.lng]} icon={glowIcon} />
                {scatterDots.map((dot, i) => (
                  <Marker
                    key={i}
                    position={[dot.lat, dot.lng]}
                    icon={L.divIcon({
      className: '',
                      html: `<div style="width:9px;height:9px;border-radius:50%;background:#FFB000;box-shadow:0 0 6px rgba(255,176,0,0.4);"></div>`,
                      iconSize: [9, 9],
                      iconAnchor: [4.5, 4.5],
                    })}
                  />
                ))}
              </MapContainer>
              {/* Gradient overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent 70%, #0D0D0D)' }} />
              {/* Location label */}
              <div className="absolute top-4 left-4 z-[1000] px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,209,193,0.2)', color: '#00D1C1' }}>
                📍 {path === 'has_business' ? businessForm.location : exploringForm.location}
              </div>
            </div>

            {/* Right — results panel */}
            <div className="w-3/5 h-full flex flex-col px-10 py-8 overflow-y-auto"
              style={{ background: '#0D0D0D', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00D1C1', boxShadow: '0 0 8px rgba(0,209,193,0.8)' }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#00D1C1' }}>
                    Analysis Complete
                  </span>
                </div>
                <h2 className="text-3xl font-semibold mb-1">
                  {path === 'has_business'
                    ? `Insights for ${businessForm.businessName || 'Your Business'}`
                    : 'Best Opportunities For You'}
                </h2>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {path === 'has_business'
                    ? `Based on the 5 km scan around ${businessForm.location}`
                    : `Top business picks around ${exploringForm.location} based on demand, competition & your budget`}
                </p>
              </motion.div>

              {/* ── EXPLORING: Suggestions ── */}
              {path === 'exploring' && (
                <div className="space-y-4 mb-8">
                  {suggestions.map((sug, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 * i }}
                      className="p-5 rounded-2xl border"
                      style={{
                        background: i === 0 ? 'rgba(0,209,193,0.05)' : 'rgba(255,255,255,0.02)',
                        borderColor: i === 0 ? 'rgba(0,209,193,0.3)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: i === 0 ? 'rgba(0,209,193,0.15)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#00D1C1' : '#9CA3AF' }}>
                          {sug.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base">{sug.name}</h3>
                            {i === 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: 'rgba(0,209,193,0.15)', color: '#00D1C1' }}>
                                ⭐ Top Pick
                              </span>
                            )}
                          </div>
                          {/* Score bar */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${sug.score}%` }}
                                transition={{ delay: 0.3 + 0.15 * i, duration: 0.8, ease: 'easeOut' }}
                                style={{ background: i === 0 ? 'linear-gradient(90deg,#00D1C1,#00BCAE)' : 'linear-gradient(90deg,#9CA3AF,#6B7280)' }}
                              />
                            </div>
                            <span className="text-xs font-bold flex-shrink-0" style={{ color: i === 0 ? '#00D1C1' : '#9CA3AF' }}>
                              {sug.score}/100
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-3" style={{ color: '#9CA3AF' }}>{sug.reason}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sug.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── HAS BUSINESS: Insights ── */}
              {path === 'has_business' && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {insights.map((ins, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 * i }}
                      className="p-5 rounded-2xl border"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: ins.color === 'teal' ? 'rgba(0,209,193,0.2)' : 'rgba(255,176,0,0.2)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: ins.color === 'teal' ? 'rgba(0,209,193,0.12)' : 'rgba(255,176,0,0.12)',
                            color: ins.color === 'teal' ? '#00D1C1' : '#FFB000',
                          }}>
                          {ins.icon}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>
                          {ins.label}
                        </span>
                      </div>
                      <div className="text-lg font-bold mb-1"
                        style={{ color: ins.color === 'teal' ? '#00D1C1' : '#FFB000' }}>
                        {ins.value}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{ins.detail}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* CTA — Start button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-auto pt-4 border-t flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-sm font-medium">Ready to launch your co-pilot</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    BijakSense will continuously monitor signals for your business.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStart}
                  className="flex items-center gap-3 px-7 py-3.5 rounded-xl font-semibold text-sm flex-shrink-0 ml-6 transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#00D1C1,#00BCAE)',
                    boxShadow: '0 0 28px rgba(0,209,193,0.35)',
                    color: '#fff',
                  }}
                >
                  Start BijakSense
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
