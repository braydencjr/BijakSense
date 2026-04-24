import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Target, Zap } from 'lucide-react';
import { MERCHANT_INFO } from '../data/mock';
import { getCached, setCache, isCached } from '../lib/cache';
import L from 'leaflet';
import oneUtamaImage from '../assets/1_utama.png';
import bubbleBoxImage from '../assets/bubble_box.png';
import singaporeFnBImage from '../assets/f&b_sg.png';
import floodNewsImage from '../assets/flood_news_image.png';
import jakartaMatchaImage from '../assets/jakarta_matcha.png';
import mrtImage from '../assets/mrt.png';
import pearlGardenImage from '../assets/pearl_garden.png';
import singaporeFnBNewsImage from '../assets/sg_f&b_news.png';
import songkranImage from '../assets/songklan image .png';
import tourismSurgeImage from '../assets/tourism_surge_news.png';

interface RegionalSignal {
  id: string;
  type: string;
  category: string;
  origin: string;
  coords: { lat: number; lng: number };
  summary: string;
  impact: string;
  urgency: string;
  agent: string;
}

interface LocalSignal {
  id: string;
  name: string;
  type: string;
  category: string;
  distance: number;
  coords: { lat: number; lng: number };
  description: string;
  urgency: string;
}

interface IntelligenceMapProps {
  isActive?: boolean;
}

function MapAutoResize({ isActive }: { isActive: boolean }) {
  const map = useMap();
  React.useEffect(() => {
    if (!isActive) return;
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [isActive, map]);
  return null;
}

const API = 'http://localhost:8000';
const INSIGHTS_CACHE_KEY = 'insights:v4';
const MAP_ALERTS_CACHE_KEY = 'map:alerts:v4';
const MAP_REGIONAL_CACHE_KEY = 'map:regional-signals:v2';
const MAP_LOCAL_CACHE_KEY = 'map:local-signals:v2';
const SIGNALS_TTL_MS = 2 * 60 * 1000;
const INSIGHTS_TTL_MS = 30 * 1000;

function buildFallbackAlerts(regional: RegionalSignal[], local: LocalSignal[]) {
  const regionalAlerts = regional.map((signal) => ({
    id: `reg-${signal.id}`,
    urgency: signal.urgency,
    headline: `Regional signal: ${signal.origin}`,
    action: signal.summary,
    reasoning: signal.impact,
  }));

  const localAlerts = local.map((signal) => ({
    id: `local-${signal.id}`,
    urgency: signal.urgency,
    headline: `Local signal: ${signal.name}`,
    action: signal.description,
    reasoning: `${signal.category} · ${signal.distance.toFixed(1)} km away`,
  }));

  return [...regionalAlerts, ...localAlerts].slice(0, 8);
}

const SIGNAL_SUPPORTING_MEDIA: Record<string, { label: string; image: string }[]> = {
  sig_thai_flood: [
    { label: 'Flood disruption report', image: floodNewsImage },
  ],
  sig_sg_inflation: [
    { label: 'Singapore F&B market report', image: singaporeFnBImage },
    { label: 'Singapore news coverage', image: singaporeFnBNewsImage },
  ],
  sig_id_matcha: [
    { label: 'Jakarta matcha trend coverage', image: jakartaMatchaImage },
  ],
  sig_thai_tourism: [
    { label: 'Songkran travel coverage', image: songkranImage },
    { label: 'Tourism surge report', image: tourismSurgeImage },
  ],
  comp_bubblebox: [
    { label: 'Bubble Box reference', image: bubbleBoxImage },
  ],
  comp_pearlgarden: [
    { label: 'Pearl Garden reference', image: pearlGardenImage },
  ],
  opp_mrt: [
    { label: 'MRT supporting document', image: mrtImage },
  ],
  opp_mall: [
    { label: '1 Utama supporting document', image: oneUtamaImage },
  ],
};

export default function IntelligenceMap({ isActive = true }: IntelligenceMapProps) {
  const [selectedRegionalSignal, setSelectedRegionalSignal] = React.useState<string | null>(null);
  const [selectedLocalSignal, setSelectedLocalSignal] = React.useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = React.useState<string | null>(null);
  const [mapView, setMapView] = React.useState<'regional' | 'local'>('regional');
  const [localMapSize, setLocalMapSize] = React.useState<'large' | 'small'>('large');
  const [now, setNow] = React.useState(new Date());
  const [scanRadius, setScanRadius] = React.useState(4600);
  const [hotspotIndex, setHotspotIndex] = React.useState(0);

  const [regionalSignals, setRegionalSignals] = React.useState<RegionalSignal[]>(() => getCached<RegionalSignal[]>(MAP_REGIONAL_CACHE_KEY) || []);
  const [localSignals, setLocalSignals] = React.useState<LocalSignal[]>(() => getCached<LocalSignal[]>(MAP_LOCAL_CACHE_KEY) || []);
  const [alerts, setAlerts] = React.useState<any[]>(() => (
    getCached<any[]>(MAP_ALERTS_CACHE_KEY) || getCached<any[]>(INSIGHTS_CACHE_KEY) || []
  ));
  const [signalsLoading, setSignalsLoading] = React.useState(!(isCached(MAP_REGIONAL_CACHE_KEY) && isCached(MAP_LOCAL_CACHE_KEY)));
  const [hasInitialized, setHasInitialized] = React.useState(isActive || isCached(MAP_REGIONAL_CACHE_KEY) || isCached(MAP_LOCAL_CACHE_KEY));

  React.useEffect(() => { if (isActive) setHasInitialized(true); }, [isActive]);

  React.useEffect(() => {
    setSelectedRegionalSignal(null);
    setSelectedLocalSignal(null);
  }, [mapView]);

  React.useEffect(() => {
    if (!hasInitialized) return;
    async function loadSignals() {
      if (isCached(MAP_REGIONAL_CACHE_KEY) && isCached(MAP_LOCAL_CACHE_KEY)) { setSignalsLoading(false); return; }
      try {
        setSignalsLoading(true);
        const [regRes, localRes] = await Promise.all([fetch(`${API}/api/signals/regional`), fetch(`${API}/api/signals/local`)]);
        const regional = await regRes.json();
        const local = await localRes.json();
        setRegionalSignals(Array.isArray(regional) ? regional : []);
        setLocalSignals(Array.isArray(local) ? local : []);
        setCache(MAP_REGIONAL_CACHE_KEY, regional, { ttlMs: SIGNALS_TTL_MS });
        setCache(MAP_LOCAL_CACHE_KEY, local, { ttlMs: SIGNALS_TTL_MS });
      } catch (e) { console.error(e); } finally { setSignalsLoading(false); }
    }
    loadSignals();
  }, [hasInitialized]);

  React.useEffect(() => {
    if (!hasInitialized) return;
    let cancelled = false;

    async function loadInsights(forceRefresh = false) {
      if (forceRefresh) {
        // Version-bump the cache key by ignoring stale in-memory/session cache on refresh.
        setCache(MAP_ALERTS_CACHE_KEY, [], { ttlMs: 0 });
      }

      const cached = getCached<any[]>(MAP_ALERTS_CACHE_KEY) || getCached<any[]>(INSIGHTS_CACHE_KEY);
      if (Array.isArray(cached) && cached.length > 0) {
        if (!cancelled) setAlerts(cached);
        return;
      }
      try {
        const res = await fetch(`${API}/api/insights`);
        const data = await res.json();
        const fetched = Array.isArray(data.insights) ? data.insights : [];
        const nextAlerts = fetched.length > 0 ? fetched : buildFallbackAlerts(regionalSignals, localSignals);
        if (!cancelled) setAlerts(nextAlerts);
        setCache(MAP_ALERTS_CACHE_KEY, nextAlerts, { ttlMs: INSIGHTS_TTL_MS });
      } catch (e) { console.error(e); }
    }

    loadInsights();

    const intervalId = window.setInterval(() => {
      loadInsights(true);
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hasInitialized, regionalSignals, localSignals]);

  React.useEffect(() => {
    if (mapView !== 'regional') return;
    if (selectedRegionalSignal) return;
    if (regionalSignals.length === 0) return;
    setSelectedRegionalSignal(regionalSignals[0].id);
  }, [mapView, selectedRegionalSignal, regionalSignals]);

  const getUrgencyColor = (u: string) => u === 'red' ? '#ef4444' : u === 'amber' ? '#f59e0b' : '#14b8a6';
  const createDotIcon = (color: string) => L.divIcon({ className: 'bg-transparent', html: `<div class="mm-signal-dot" style="background:${color}; width:16px; height:16px; border-radius:50%; box-shadow: 0 0 15px ${color};"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
  const merchantIcon = L.divIcon({ className: 'bg-transparent', html: `<div class="mm-merchant-dot" style="width:24px; height:24px; background:#fff; border:4px solid #14b8a6; border-radius:50%; box-shadow: 0 0 20px #14b8a6;"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
  const competitorIcon = L.divIcon({ className: 'bg-transparent', html: `<div style="width:14px; height:14px; background:#FF4B4B; border:2px solid #fff; border-radius:50%; box-shadow:0 0 8px #FF4B4B;"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
  const crowdIcon = L.divIcon({ className: 'bg-transparent', html: `<div style="width:14px; height:14px; background:#00D1C1; border:2px solid #fff; border-radius:50%; box-shadow:0 0 8px #00D1C1;"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });

  const localHotspots = localSignals.filter(s => s.type === 'competitor' || s.type === 'opportunity');
  const activeHotspot = localHotspots[hotspotIndex % Math.max(localHotspots.length, 1)];

  React.useEffect(() => {
    if (!isActive) return;
    const clock = setInterval(() => setNow(new Date()), 1000);
    const scan = setInterval(() => setScanRadius(p => p >= 5000 ? 4200 : p + 120), 900);
    const hotspot = setInterval(() => setHotspotIndex(p => (p + 1) % Math.max(localHotspots.length, 1)), 3500);
    return () => { clearInterval(clock); clearInterval(scan); clearInterval(hotspot); };
  }, [isActive, localHotspots.length]);


  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <style>{`
        .leaflet-container { background: #111318 !important; width: 100%; height: 100%; }
        .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.8); }
        .mm-signal-dot { animation: mmPulse 1.8s ease-in-out infinite; }
        @keyframes mmPulse { 0% { transform: scale(0.92); opacity: 0.7; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.92); opacity: 0.7; } }
        .mm-merchant-dot { animation: mmGlow 2.2s ease-in-out infinite; }
        @keyframes mmGlow { 0% { box-shadow: 0 0 8px rgba(20,184,166,0.4); } 50% { box-shadow: 0 0 24px rgba(20,184,166,1); } 100% { box-shadow: 0 0 8px rgba(20,184,166,0.4); } }
        .mm-scroll::-webkit-scrollbar { height: 4px; }
        .mm-scroll::-webkit-scrollbar-thumb { background: rgba(0,209,193,0.3); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 shrink-0 z-20" style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gray-500">{new Date().toISOString().split('T')[0]}</span>
            <span className="uppercase tracking-widest text-[10px] font-bold text-[#00D1C1]">Live Intelligence Map</span>
          </div>
          <div className="flex items-center rounded bg-white/5 border border-white/10 p-0.5">
            <button onClick={() => setMapView('regional')} className={`px-2 py-1 text-[9px] font-bold rounded ${mapView === 'regional' ? 'bg-[#00D1C1]/20 text-[#00D1C1]' : 'text-gray-500'}`}>REGIONAL</button>
            <button onClick={() => setMapView('local')} className={`px-2 py-1 text-[9px] font-bold rounded ${mapView === 'local' ? 'bg-[#00D1C1]/20 text-[#00D1C1]' : 'text-gray-500'}`}>LOCAL 5KM</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">{MERCHANT_INFO.businessName}</span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#00D1C1] bg-[#00D1C1]/10 px-2 py-1 rounded border border-[#00D1C1]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] animate-pulse" />
            <span>LIVE {now.toUTCString().split(' ')[4]} UTC</span>
          </div>
          <Bell className="w-5 h-5 text-gray-500" />
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden h-full">
        <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
          <div className="absolute top-4 left-4 z-[1000] bg-[#111318]/90 backdrop-blur p-2 border border-[#00D1C1]/30 rounded shadow-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#00D1C1]" />
              <p className="text-[10px] font-medium text-gray-400">{mapView === 'regional' ? 'SEA-LEVEL TRACKING' : 'LOCAL 5KM RADIUS'}</p>
            </div>
            {mapView === 'local' && activeHotspot && (
              <p className="text-[9px] mt-1 font-bold text-[#00D1C1]">◉ Detection: {activeHotspot.name}</p>
            )}
          </div>

          <div className="flex-1 w-full h-full">
            <MapContainer
              key={`${mapView}-${localMapSize}`}
              center={mapView === 'regional' ? [7.5, 102.0] : [MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
              zoom={mapView === 'regional' ? 5 : 14}
              zoomControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              <MapAutoResize isActive={isActive} />
              <TileLayer url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} icon={merchantIcon} />

              {mapView === 'regional' && regionalSignals.map(s => {
                const color = getUrgencyColor(s.urgency);
                return (
                  <React.Fragment key={s.id}>
                    <Marker
                      position={[s.coords.lat, s.coords.lng]}
                      icon={createDotIcon(color)}
                      eventHandlers={{ click: () => setSelectedRegionalSignal(s.id === selectedRegionalSignal ? null : s.id) }}
                    />
                    {s.urgency === 'red' && <Polyline positions={[[s.coords.lat, s.coords.lng], [MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]]} pathOptions={{ color, weight: 1, opacity: 0.4, dashArray: '5, 5' }} />}
                  </React.Fragment>
                );
              })}

              {mapView === 'local' && (
                <>
                  <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={5000} pathOptions={{ color: '#00D1C1', weight: 1.5, opacity: 0.5, dashArray: '4 6' }} />
                  <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={scanRadius} pathOptions={{ color: '#00D1C1', weight: 1, opacity: 0.2 }} />
                  {localSignals.map(s => (
                    <Marker
                      key={s.id}
                      position={[s.coords.lat, s.coords.lng]}
                      icon={s.type === 'competitor' ? competitorIcon : crowdIcon}
                      eventHandlers={{ click: () => setSelectedLocalSignal(s.id === selectedLocalSignal ? null : s.id) }}
                    />
                  ))}
                </>
              )}
            </MapContainer>
          </div>

          {/* Signal Detail Overlays — two-column layout, right = info+source, left = images */}
          <AnimatePresence>
            {mapView === 'regional' && selectedRegionalSignal && (() => {
              const s = regionalSignals.find(x => x.id === selectedRegionalSignal);
              if (!s) return null;
              const media = SIGNAL_SUPPORTING_MEDIA[s.id] || [];
              return (
                <motion.div
                  key="reg-overlay"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1000] flex gap-3 p-4 pointer-events-none"
                >
                  {/* Left column: evidence images */}
                  <div className="flex flex-col gap-3 overflow-y-auto mm-scroll pointer-events-auto shrink-0 max-w-[24rem]">
                    {media.map((item, i) => (
                      <motion.div
                        key={`reg-img-${i}`}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0B0D10] backdrop-blur-md"
                      >
                        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.03] flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-[8px] font-bold text-amber-400">
                            {i + 1}
                          </span>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-[#08090C]">
                          <img src={item.image} alt={item.label} className="w-full h-auto max-h-[240px] object-contain rounded" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Spacer to push right column to the right */}
                  <div className="flex-1" />

                  {/* Right column: signal info + source */}
                  <div className="flex flex-col gap-3 pointer-events-auto shrink-0 w-[24rem]">
                    <motion.div
                      key="reg-info"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="bg-[#111318]/95 border border-[#00D1C1]/30 p-4 rounded-xl shadow-2xl backdrop-blur-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D1C1]/10 text-[#00D1C1] border border-[#00D1C1]/20 uppercase">{s.type}</span>
                        <Target className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="font-bold text-sm mb-1">{s.origin}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">{s.summary}</p>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Business Impact</p>
                        <p className="text-[11px] text-[#00D1C1] font-medium">{s.impact}</p>
                      </div>
                    </motion.div>

                    {media.length > 0 && (
                      <motion.div
                        key="reg-source"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: 0.08 }}
                        className="bg-[#111318]/95 border border-amber-400/20 p-4 rounded-xl shadow-2xl backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Source</p>
                        </div>
                        <div className="space-y-1">
                          {media.map((item, i) => (
                            <div key={`src-${i}`} className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-[#00D1C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-[11px] text-[#00D1C1] font-medium">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {mapView === 'local' && selectedLocalSignal && (() => {
              const s = localSignals.find(x => x.id === selectedLocalSignal);
              if (!s) return null;
              const media = SIGNAL_SUPPORTING_MEDIA[s.id] || [];
              return (
                <motion.div
                  key="local-overlay"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1000] flex gap-3 p-4 pointer-events-none"
                >
                  {/* Left column: evidence images */}
                  <div className="flex flex-col gap-3 overflow-y-auto mm-scroll pointer-events-auto shrink-0 max-w-[24rem]">
                    {media.map((item, i) => (
                      <motion.div
                        key={`local-img-${i}`}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0B0D10] backdrop-blur-md"
                      >
                        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.03] flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-[8px] font-bold text-amber-400">
                            {i + 1}
                          </span>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-[#08090C]">
                          <img src={item.image} alt={item.label} className="w-full h-auto max-h-[240px] object-contain rounded" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Right column: signal info + source */}
                  <div className="flex flex-col gap-3 pointer-events-auto shrink-0 w-[24rem]">
                    <motion.div
                      key="local-info"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="bg-[#111318]/95 border border-[#00D1C1]/30 p-4 rounded-xl shadow-2xl backdrop-blur-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D1C1]/10 text-[#00D1C1] border border-[#00D1C1]/20 uppercase">
                          {s.type}
                        </span>
                        <Target className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="font-bold text-sm mb-1">{s.name}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">{s.description}</p>
                      <div className="p-2 rounded bg-white/5 border border-white/10 space-y-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Category</p>
                          <p className="text-[11px] text-[#00D1C1] font-medium">{s.category}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Distance</p>
                          <p className="text-[11px] text-[#00D1C1] font-medium">{s.distance.toFixed(1)} km away</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Urgency</p>
                          <p className="text-[11px] text-[#00D1C1] font-medium">{s.urgency}</p>
                        </div>
                      </div>
                    </motion.div>

                    {media.length > 0 && (
                      <motion.div
                        key="local-source"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: 0.08 }}
                        className="bg-[#111318]/95 border border-amber-400/20 p-4 rounded-xl shadow-2xl backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Source</p>
                        </div>
                        <div className="space-y-1">
                          {media.map((item, i) => (
                            <div key={`src-${i}`} className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-[#00D1C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-[11px] text-[#00D1C1] font-medium">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Insights Panel */}
      <div className="h-44 shrink-0 bg-[#111318] border-t border-white/10 z-20 flex flex-col">
        <div className="px-5 py-2 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Insights ({alerts.length})</span>
          </div>
          <button className="text-[9px] font-bold text-[#00D1C1]">VIEW ALL LOGS →</button>
        </div>
        <div className="flex-1 overflow-x-auto mm-scroll p-3 flex gap-3 items-stretch h-full">
          {alerts.map((alert) => {
            const color = alert.urgency === 'red' ? '#ef4444' : alert.urgency === 'amber' ? '#f59e0b' : '#14b8a6';
            return (
              <div key={alert.id} className="w-64 shrink-0 rounded-xl p-3 border flex flex-col justify-between h-full" style={{ background: `${color}05`, borderColor: `${color}30` }}>
                <div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border mb-2 inline-block" style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{alert.urgency.toUpperCase()}</span>
                  <h4 className="text-xs font-bold text-gray-100 truncate mb-1">{alert.headline}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{alert.action}</p>
                </div>
                <div className="text-[9px] italic text-gray-600 border-t border-white/5 pt-2 mt-2 truncate">{alert.reasoning}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
