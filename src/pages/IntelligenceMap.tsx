import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Target, Zap, Sparkles, MapPinned, X } from 'lucide-react';
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

interface ExpansionOnboarding {
  businessType: string;
  expansionGoal: 'kiosk' | 'full-branch' | 'cloud-kitchen';
  monthlyRentBudget: number;
  preferredFootTraffic: 'medium' | 'high' | 'very-high';
  maxDistanceKm: number;
}

interface LocationRecommendation {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  distanceKm: number;
  footTrafficScore: number;
  rentEstimateMyr: number;
  rentOpportunityScore: number;
  locationPotentialScore: number;
  overallScore: number;
  summary: string;
  rationale: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function urgencyBoost(urgency: string) {
  if (urgency === 'red') return 14;
  if (urgency === 'amber') return 9;
  return 6;
}

function extractAreaName(name: string) {
  return name
    .replace(/\s+MRT.*$/i, '')
    .replace(/\s+Mall.*$/i, '')
    .trim();
}

function buildLocationRecommendations(
  localSignals: LocalSignal[],
  onboarding: ExpansionOnboarding,
  merchantCoords: { lat: number; lng: number }
) {
  const opportunities = localSignals.filter((signal) => signal.type === 'opportunity');
  const competitors = localSignals.filter((signal) => signal.type === 'competitor');
  const trafficWeight = onboarding.preferredFootTraffic === 'very-high' ? 1.2 : onboarding.preferredFootTraffic === 'high' ? 1.08 : 0.95;
  const goalWeight = onboarding.expansionGoal === 'kiosk' ? 1.08 : onboarding.expansionGoal === 'cloud-kitchen' ? 0.92 : 1;
  const rentPenaltyWeight = onboarding.expansionGoal === 'kiosk' ? 1.15 : onboarding.expansionGoal === 'cloud-kitchen' ? 0.8 : 1;
  const businessTypeHint = onboarding.businessType.toLowerCase();

  return opportunities
    .map((opp): LocationRecommendation => {
      const distanceKm = haversineKm(merchantCoords, opp.coords);
      const nearbyCompetitors = competitors.filter((comp) => haversineKm(opp.coords, comp.coords) <= 1.2).length;
      const anchorBoost = /mrt|mall|hub|transit/i.test(opp.name) ? 10 : 0;
      const categoryFit =
        onboarding.expansionGoal === 'kiosk' && /retail|infrastructure/.test(opp.category.toLowerCase()) ? 8 :
        onboarding.expansionGoal === 'cloud-kitchen' && /event/.test(opp.category.toLowerCase()) ? 6 :
        3;
      const urgency = urgencyBoost(opp.urgency);

      const footTrafficScore = clamp(
        (54 + urgency + anchorBoost + categoryFit + nearbyCompetitors * 3 + Math.max(0, 16 - distanceKm * 4)) * trafficWeight * goalWeight,
        35,
        98
      );

      const businessTypeRentFactor = /tea|coffee|drink/.test(businessTypeHint) ? 1.02 : 1.07;
      const rentEstimateMyr = Math.round((2450 + footTrafficScore * 22 + nearbyCompetitors * 320) * businessTypeRentFactor);
      const rentOpportunityScore = clamp(
        72 + (onboarding.monthlyRentBudget - rentEstimateMyr) / (90 / rentPenaltyWeight),
        18,
        96
      );

      const locationPotentialScore = clamp(
        0.48 * footTrafficScore +
          0.32 * rentOpportunityScore +
          0.20 * Math.max(0, 100 - distanceKm * 11),
        22,
        98
      );

      const overallScore = clamp(
        Math.round(0.5 * locationPotentialScore + 0.3 * footTrafficScore + 0.2 * rentOpportunityScore),
        0,
        99
      );

      const area = extractAreaName(opp.name);
      const rentTone = rentEstimateMyr <= onboarding.monthlyRentBudget ? 'Rent is manageable' : 'Rent is above your target';
      const transitTone = /mrt/i.test(opp.name) ? 'MRT connectivity is improving' : 'accessibility is stable';

      return {
        id: `rec-${opp.id}`,
        name: area || opp.name,
        coords: opp.coords,
        distanceKm,
        footTrafficScore,
        rentEstimateMyr,
        rentOpportunityScore,
        locationPotentialScore,
        overallScore,
        summary: `${area || opp.name} is a good opportunity. ${rentTone} and ${transitTone}.`,
        rationale: `${opp.description} Nearby competition: ${nearbyCompetitors}. Estimated rent: RM ${rentEstimateMyr.toLocaleString()}/month.`,
      };
    })
    .filter((rec) => rec.distanceKm <= onboarding.maxDistanceKm)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3);
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function offsetCoords(
  center: { lat: number; lng: number },
  distanceKm: number,
  angleDeg: number
) {
  const angle = (angleDeg * Math.PI) / 180;
  const dLat = (distanceKm / 111) * Math.cos(angle);
  const dLng = (distanceKm / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

function buildInteractiveLocalSignals(
  baseSignals: LocalSignal[],
  onboarding: ExpansionOnboarding,
  merchantCoords: { lat: number; lng: number }
) {
  const withinRadius = baseSignals.filter((signal) => haversineKm(merchantCoords, signal.coords) <= onboarding.maxDistanceKm);
  const baseCompetitors = withinRadius.filter((signal) => signal.type === 'competitor');
  const baseOpportunities = withinRadius.filter((signal) => signal.type === 'opportunity');

  const trafficFactor = onboarding.preferredFootTraffic === 'very-high' ? 1.35 : onboarding.preferredFootTraffic === 'high' ? 1.1 : 0.9;
  const goalFactor = onboarding.expansionGoal === 'kiosk' ? 0.9 : onboarding.expansionGoal === 'cloud-kitchen' ? 1.15 : 1;
  const budgetFactor = clamp(onboarding.monthlyRentBudget / 5500, 0.7, 1.35);
  const density = trafficFactor * goalFactor * budgetFactor * (onboarding.maxDistanceKm / 5);

  const targetCompetitors = Math.round(clamp(2 + density * 3.5, 2, 12));
  const targetOpportunities = Math.round(clamp(1 + trafficFactor * 1.7 + goalFactor, 1, 8));

  const scenarioSeed = hashString(
    `${onboarding.businessType}|${onboarding.expansionGoal}|${onboarding.preferredFootTraffic}|${onboarding.monthlyRentBudget}|${onboarding.maxDistanceKm}`
  );

  const competitorTemplates = ['Transit Kiosk', 'Campus Tea Corner', 'Street Beverage Pod', 'Express Tea Spot'];
  const opportunityTemplates = ['Co-working Cluster', 'LRT Feeder Stop', 'Night Market Strip', 'Office Lunch Belt'];

  const competitors = [...baseCompetitors]
    .sort((a, b) => haversineKm(merchantCoords, a.coords) - haversineKm(merchantCoords, b.coords))
    .slice(0, targetCompetitors);

  for (let i = competitors.length; i < targetCompetitors; i += 1) {
    const ringDistance = clamp(0.9 + i * 0.45, 0.7, onboarding.maxDistanceKm * 0.95);
    const angle = (scenarioSeed + i * 53) % 360;
    const coords = offsetCoords(merchantCoords, ringDistance, angle);
    competitors.push({
      id: `sim-comp-${i}`,
      name: `${competitorTemplates[i % competitorTemplates.length]} ${i + 1}`,
      type: 'competitor',
      category: onboarding.businessType || 'F&B',
      distance: ringDistance,
      coords,
      description: 'Simulated nearby competitor based on current market density assumptions.',
      urgency: i % 2 === 0 ? 'amber' : 'teal',
    });
  }

  const opportunities = [...baseOpportunities]
    .sort((a, b) => {
      const scoreA = urgencyBoost(a.urgency) - haversineKm(merchantCoords, a.coords) * 3;
      const scoreB = urgencyBoost(b.urgency) - haversineKm(merchantCoords, b.coords) * 3;
      return scoreB - scoreA;
    })
    .slice(0, targetOpportunities);

  for (let i = opportunities.length; i < targetOpportunities; i += 1) {
    const ringDistance = clamp(0.8 + i * 0.55, 0.6, onboarding.maxDistanceKm * 0.92);
    const angle = (scenarioSeed + 117 + i * 67) % 360;
    const coords = offsetCoords(merchantCoords, ringDistance, angle);
    opportunities.push({
      id: `sim-opp-${i}`,
      name: `${opportunityTemplates[i % opportunityTemplates.length]} ${i + 1}`,
      type: 'opportunity',
      category: onboarding.expansionGoal === 'kiosk' ? 'retail' : onboarding.expansionGoal === 'cloud-kitchen' ? 'delivery-zone' : 'infrastructure',
      distance: ringDistance,
      coords,
      description: 'Simulated high-potential zone inferred from your onboarding preferences.',
      urgency: i % 3 === 0 ? 'amber' : 'teal',
    });
  }

  return [...competitors, ...opportunities].filter(
    (signal) => haversineKm(merchantCoords, signal.coords) <= onboarding.maxDistanceKm
  );
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
  comp_matchadreams: [
    { label: 'Matcha Dreams reference', image: jakartaMatchaImage },
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
  const [selectedRecommendation, setSelectedRecommendation] = React.useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = React.useState<string | null>(null);
  const [mapView, setMapView] = React.useState<'regional' | 'local'>('regional');
  const [localMapSize, setLocalMapSize] = React.useState<'large' | 'small'>('large');
  const [now, setNow] = React.useState(new Date());
  const [scanRadius, setScanRadius] = React.useState(4200);
  const [hotspotIndex, setHotspotIndex] = React.useState(0);
  const [onboarding, setOnboarding] = React.useState<ExpansionOnboarding>({
    businessType: MERCHANT_INFO.subCategory,
    expansionGoal: 'full-branch',
    monthlyRentBudget: 5500,
    preferredFootTraffic: 'high',
    maxDistanceKm: 5,
  });

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
    setSelectedRecommendation(null);
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

  const getUrgencyColor = React.useCallback((u: string) => u === 'red' ? '#ef4444' : u === 'amber' ? '#f59e0b' : '#14b8a6', []);

  const iconCache = React.useRef<Record<string, L.DivIcon>>({});
  const getDotIcon = React.useCallback((color: string) => {
    if (!iconCache.current[color]) {
      iconCache.current[color] = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="mm-signal-dot" style="background:${color}; width:16px; height:16px; border-radius:50%; box-shadow: 0 0 15px ${color};"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
    }
    return iconCache.current[color];
  }, []);

  const merchantIcon = React.useMemo(() => L.divIcon({ className: 'bg-transparent', html: `<div class="mm-merchant-dot" style="width:24px; height:24px; background:#fff; border:4px solid #14b8a6; border-radius:50%; box-shadow: 0 0 20px #14b8a6;"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] }), []);
  const competitorIcon = React.useMemo(() => L.divIcon({ className: 'bg-transparent', html: `<div style="width:14px; height:14px; background:#FF4B4B; border:2px solid #fff; border-radius:50%; box-shadow:0 0 8px #FF4B4B;"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }), []);
  const crowdIcon = React.useMemo(() => L.divIcon({ className: 'bg-transparent', html: `<div style="width:14px; height:14px; background:#00D1C1; border:2px solid #fff; border-radius:50%; box-shadow:0 0 8px #00D1C1;"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }), []);
  const recommendationIcon = React.useMemo(() => L.divIcon({ className: 'bg-transparent', html: `<div style="width:18px; height:18px; background:#f59e0b; border:2px solid #fff; border-radius:6px; transform: rotate(45deg); box-shadow:0 0 10px rgba(245,158,11,0.9);"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }), []);

  const displayRadiusMeters = Math.round(onboarding.maxDistanceKm * 1000);
  const interactiveLocalSignals = React.useMemo(
    () => buildInteractiveLocalSignals(localSignals, onboarding, MERCHANT_INFO.coordinates),
    [localSignals, onboarding]
  );
  const displayedLocalSignals = React.useMemo(
    () => interactiveLocalSignals.filter((signal) => haversineKm(MERCHANT_INFO.coordinates, signal.coords) <= onboarding.maxDistanceKm),
    [interactiveLocalSignals, onboarding.maxDistanceKm]
  );
  const localHotspots = displayedLocalSignals.filter(s => s.type === 'competitor' || s.type === 'opportunity');
  const activeHotspot = localHotspots[hotspotIndex % Math.max(localHotspots.length, 1)];
  const locationRecommendations = React.useMemo(
    () => buildLocationRecommendations(displayedLocalSignals, onboarding, MERCHANT_INFO.coordinates),
    [displayedLocalSignals, onboarding]
  );
  const featuredRecommendation = locationRecommendations.find((rec) => rec.id === selectedRecommendation) || locationRecommendations[0] || null;

  React.useEffect(() => {
    if (!selectedRecommendation) return;
    if (!locationRecommendations.some((rec) => rec.id === selectedRecommendation)) {
      setSelectedRecommendation(null);
    }
  }, [selectedRecommendation, locationRecommendations]);

  React.useEffect(() => {
    if (!isActive) return;
    const clock = setInterval(() => setNow(new Date()), 1000);
    const minScan = Math.round(displayRadiusMeters * 0.82);
    const maxScan = displayRadiusMeters;
    const scan = setInterval(() => setScanRadius(p => p >= maxScan ? minScan : p + Math.max(80, Math.round(displayRadiusMeters * 0.024))), 900);
    const hotspot = setInterval(() => setHotspotIndex(p => (p + 1) % Math.max(localHotspots.length, 1)), 3500);
    return () => { clearInterval(clock); clearInterval(scan); clearInterval(hotspot); };
  }, [isActive, localHotspots.length, displayRadiusMeters]);

  React.useEffect(() => {
    setScanRadius(Math.round(displayRadiusMeters * 0.9));
  }, [displayRadiusMeters]);

  React.useEffect(() => {
    if (!selectedLocalSignal) return;
    const stillVisible = displayedLocalSignals.some((s) => s.id === selectedLocalSignal);
    if (!stillVisible) setSelectedLocalSignal(null);
  }, [selectedLocalSignal, displayedLocalSignals]);


  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <style>{`
        .leaflet-container { background: #111318 !important; width: 100%; height: 100%; }
        .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.8); }
        .mm-signal-dot { animation: mmPulse 2.5s ease-in-out infinite; }
        @keyframes mmPulse { 0% { opacity: 0.6; filter: brightness(1) blur(0px); } 50% { opacity: 1; filter: brightness(1.4) blur(0.5px); } 100% { opacity: 0.6; filter: brightness(1) blur(0px); } }
        .mm-merchant-dot { animation: mmGlow 2.2s ease-in-out infinite; }
        @keyframes mmGlow { 0% { box-shadow: 0 0 8px rgba(20,184,166,0.4); } 50% { box-shadow: 0 0 24px rgba(20,184,166,1); } 100% { box-shadow: 0 0 8px rgba(20,184,166,0.4); } }
        .mm-scroll::-webkit-scrollbar { height: 4px; }
        .mm-scroll::-webkit-scrollbar-thumb { background: rgba(0,209,193,0.3); border-radius: 2px; }
        .mm-input {
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          transition: all 0.2s ease;
        }
        .mm-input:focus {
          border-color: #00D1C1 !important;
          background: rgba(0,209,193,0.05);
          box-shadow: 0 0 0 1px rgba(0,209,193,0.2);
          outline: none;
        }
        select option {
          background-color: #111318;
          color: #F8F9FA;
        }
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
            <button onClick={() => setMapView('local')} className={`px-2 py-1 text-[9px] font-bold rounded ${mapView === 'local' ? 'bg-[#00D1C1]/20 text-[#00D1C1]' : 'text-gray-500'}`}>LOCAL {onboarding.maxDistanceKm.toFixed(1)}KM</button>
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
          <div className="absolute top-4 right-4 z-[1000] bg-[#111318]/90 backdrop-blur p-2 border border-[#00D1C1]/30 rounded shadow-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#00D1C1]" />
              <p className="text-[10px] font-medium text-gray-400">{mapView === 'regional' ? 'SEA-LEVEL TRACKING' : `LOCAL ${onboarding.maxDistanceKm.toFixed(1)}KM RADIUS`}</p>
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
                      icon={getDotIcon(color)}
                      eventHandlers={{ click: () => setSelectedRegionalSignal(s.id === selectedRegionalSignal ? null : s.id) }}
                    />
                    {s.urgency === 'red' && <Polyline positions={[[s.coords.lat, s.coords.lng], [MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]]} pathOptions={{ color, weight: 1, opacity: 0.4, dashArray: '5, 5' }} />}
                  </React.Fragment>
                );
              })}

              {mapView === 'local' && (
                <>
                  <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={displayRadiusMeters} pathOptions={{ color: '#00D1C1', weight: 1.5, opacity: 0.5, dashArray: '4 6' }} />
                  <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={scanRadius} pathOptions={{ color: '#00D1C1', weight: 1, opacity: 0.2 }} />
                  {displayedLocalSignals.map(s => (
                    <Marker
                      key={s.id}
                      position={[s.coords.lat, s.coords.lng]}
                      icon={s.type === 'competitor' ? competitorIcon : crowdIcon}
                      eventHandlers={{ click: () => { setSelectedLocalSignal(s.id === selectedLocalSignal ? null : s.id); setSelectedRecommendation(null); } }}
                    />
                  ))}
                  {locationRecommendations.map((rec) => (
                    <Marker
                      key={rec.id}
                      position={[rec.coords.lat, rec.coords.lng]}
                      icon={recommendationIcon}
                      eventHandlers={{
                        click: () => {
                          setSelectedRecommendation(rec.id === selectedRecommendation ? null : rec.id);
                          setSelectedLocalSignal(null);
                        },
                      }}
                    />
                  ))}
                </>
              )}
            </MapContainer>
          </div>

          {mapView === 'local' && (
            <motion.div
              drag
              dragMomentum={false}
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0}
              className="absolute right-4 bottom-4 z-[1100] w-[23rem] max-w-[calc(100%-2rem)] pointer-events-auto"
            >
              <div className="bg-[#111318]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-[#00D1C1]" />
                     <p className="text-[11px] font-bold uppercase tracking-wide text-[#00D1C1]">AI Expansion Scout</p>
                   </div>
                   <div className="flex items-center gap-3 cursor-move">
                     <span className="text-[9px] text-gray-400">Drag to move</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-gray-300 font-semibold">
                    Business type
                    <input
                      value={onboarding.businessType}
                      onChange={(e) => setOnboarding((prev) => ({ ...prev, businessType: e.target.value }))}
                      className="mt-1 w-full rounded border border-white/10 px-2 py-1.5 text-[11px] text-[#00D1C1] font-medium mm-input"
                    />
                  </label>

                  <label className="text-[10px] text-gray-300 font-semibold">
                    Expansion goal
                    <select
                      value={onboarding.expansionGoal}
                      onChange={(e) => setOnboarding((prev) => ({ ...prev, expansionGoal: e.target.value as ExpansionOnboarding['expansionGoal'] }))}
                      className="mt-1 w-full rounded border border-white/10 px-2 py-1.5 text-[11px] text-[#00D1C1] font-medium mm-input"
                    >
                      <option value="kiosk">Kiosk</option>
                      <option value="full-branch">Full branch</option>
                      <option value="cloud-kitchen">Cloud kitchen</option>
                    </select>
                  </label>

                  <label className="text-[10px] text-gray-300 font-semibold">
                    Max rent (RM)
                    <input
                      type="number"
                      min={1000}
                      step={100}
                      value={onboarding.monthlyRentBudget}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setOnboarding((prev) => ({ ...prev, monthlyRentBudget: Number.isFinite(next) ? next : prev.monthlyRentBudget }));
                      }}
                      className="mt-1 w-full rounded border border-white/10 px-2 py-1.5 text-[11px] text-[#00D1C1] font-medium mm-input"
                    />
                  </label>

                  <label className="text-[10px] text-gray-300 font-semibold">
                    Foot traffic target
                    <select
                      value={onboarding.preferredFootTraffic}
                      onChange={(e) => setOnboarding((prev) => ({ ...prev, preferredFootTraffic: e.target.value as ExpansionOnboarding['preferredFootTraffic'] }))}
                      className="mt-1 w-full rounded border border-white/10 px-2 py-1.5 text-[11px] text-[#00D1C1] font-medium mm-input"
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="very-high">Very High</option>
                    </select>
                  </label>
                </div>

                <label className="block text-[10px] text-gray-400 mt-3">
                  Scout radius: {onboarding.maxDistanceKm.toFixed(1)} km
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={0.5}
                    value={onboarding.maxDistanceKm}
                    onChange={(e) => setOnboarding((prev) => ({ ...prev, maxDistanceKm: Number(e.target.value) }))}
                    className="mt-1 w-full accent-[#00D1C1]"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Overlays: top-left = photos, top-right = info block (competitor or AI score) */}
          <AnimatePresence>
            {/* Regional signal overlay */}
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
                  <div className="flex-1" />
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

            {/* Local competitor signal overlay — top-left photos, top-right info */}
            {mapView === 'local' && selectedLocalSignal && (() => {
              const s = displayedLocalSignals.find(x => x.id === selectedLocalSignal);
              if (!s) return null;
              const media = SIGNAL_SUPPORTING_MEDIA[s.id] || [];
              return (
                <motion.div
                  key="local-overlay"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-4 left-4 z-[1050] flex gap-3 pointer-events-none"
                  style={{ maxHeight: 'calc(100% - 2rem)' }}
                >
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
                </motion.div>
              );
            })()}

            {/* Competitor info — top-right */}
            {mapView === 'local' && selectedLocalSignal && (() => {
              const s = displayedLocalSignals.find(x => x.id === selectedLocalSignal);
              if (!s) return null;
              const media = SIGNAL_SUPPORTING_MEDIA[s.id] || [];
              return (
                <motion.div
                  key="local-info-overlay"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 z-[1050] pointer-events-auto shrink-0 w-[24rem] space-y-3"
                  style={{ maxHeight: 'calc(100% - 2rem)', overflowY: 'auto' }}
                >
                  <div className="bg-[#111318]/95 border border-[#00D1C1]/30 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D1C1]/10 text-[#00D1C1] border border-[#00D1C1]/20 uppercase">
                        {s.type}
                      </span>
                      <button onClick={() => setSelectedLocalSignal(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
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
                  </div>
                  {media.length > 0 && (
                    <div className="bg-[#111318]/95 border border-amber-400/20 p-4 rounded-xl shadow-2xl backdrop-blur-md">
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
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Golden marker (AI recommendation) overlay — top-left photos, top-right AI score card */}
            {mapView === 'local' && selectedRecommendation && featuredRecommendation && (() => {
              const oppId = selectedRecommendation.replace('rec-', '');
              const media = SIGNAL_SUPPORTING_MEDIA[oppId] || [];
              return (
                <>
                  {/* Photos — top-left */}
                  <motion.div
                    key="rec-photos"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="absolute top-4 left-4 z-[1050] pointer-events-auto shrink-0 max-w-[24rem] space-y-3"
                    style={{ maxHeight: 'calc(100% - 2rem)', overflowY: 'auto' }}
                  >
                    {media.map((item, i) => (
                      <motion.div
                        key={`rec-img-${i}`}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0B0D10] backdrop-blur-md"
                      >
                        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.03] flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-[8px] font-bold text-amber-400">
                            {i + 1}
                          </span>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-[#08090C]">
                          <img src={item.image} alt={item.label} className="w-full h-auto max-h-[200px] object-contain rounded" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* AI score card — top-right */}
                  <motion.div
                    key="rec-info"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="absolute top-4 right-4 z-[1050] pointer-events-auto shrink-0 w-[24rem]"
                    style={{ maxHeight: 'calc(100% - 2rem)', overflowY: 'auto' }}
                  >
                    <div className="bg-[#111318]/95 border border-[#00D1C1]/25 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#00D1C1]">Top AI Recommendation</p>
                          <p className="text-sm font-semibold text-white mt-1">{featuredRecommendation.name}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D1C1]/10 border border-[#00D1C1]/25 text-[#00D1C1]">
                            SCORE {featuredRecommendation.overallScore}
                          </span>
                          <button
                            onClick={() => setSelectedRecommendation(null)}
                            className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[12px] text-gray-300 mt-2 leading-relaxed">{featuredRecommendation.summary}</p>
                      <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{featuredRecommendation.rationale}</p>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                        <div className="rounded bg-white/5 border border-white/10 p-2">
                          <p className="text-gray-500 uppercase font-bold">Location potential</p>
                          <p className="text-[#00D1C1] font-semibold mt-1">{featuredRecommendation.locationPotentialScore.toFixed(0)}/100</p>
                        </div>
                        <div className="rounded bg-white/5 border border-white/10 p-2">
                          <p className="text-gray-500 uppercase font-bold">Foot traffic</p>
                          <p className="text-[#00D1C1] font-semibold mt-1">{featuredRecommendation.footTrafficScore.toFixed(0)}/100</p>
                        </div>
                        <div className="rounded bg-white/5 border border-white/10 p-2">
                          <p className="text-gray-500 uppercase font-bold">Rent estimate</p>
                          <p className="text-[#00D1C1] font-semibold mt-1">RM {featuredRecommendation.rentEstimateMyr.toLocaleString()}</p>
                        </div>
                        <div className="rounded bg-white/5 border border-white/10 p-2">
                          <p className="text-gray-500 uppercase font-bold">Coordinates</p>
                          <p className="text-[#00D1C1] font-semibold mt-1">{featuredRecommendation.coords.lat.toFixed(4)}, {featuredRecommendation.coords.lng.toFixed(4)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 overflow-x-auto mm-scroll">
                        {locationRecommendations.map((rec) => (
                          <button
                            key={rec.id}
                            onClick={() => setSelectedRecommendation(rec.id)}
                            className={`shrink-0 px-2 py-1 rounded border text-[10px] font-semibold ${selectedRecommendation === rec.id ? 'border-[#00D1C1]/40 text-[#00D1C1] bg-[#00D1C1]/10' : 'border-white/10 text-gray-400 bg-white/5'}`}
                          >
                            {rec.name}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                        <MapPinned className="w-3 h-3 text-[#00D1C1]" />
                        Suggested sites are pinned as gold markers on the map.
                      </div>
                    </div>
                  </motion.div>
                </>
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
