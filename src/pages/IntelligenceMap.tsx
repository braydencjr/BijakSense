import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Activity, Target, Zap } from 'lucide-react';
import { WORLD_SIGNALS, MERCHANT_INFO, AGENTS, ALERTS, LOCAL_COMPETITORS } from '../data/mock';
import L from 'leaflet';

export default function IntelligenceMap() {
  const [selectedSignal, setSelectedSignal] = React.useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = React.useState<string | null>(null);
  const [mapView, setMapView] = React.useState<'regional' | 'local'>('regional');
  const [localMapSize, setLocalMapSize] = React.useState<'large' | 'small'>('large');
  const [now, setNow] = React.useState(new Date());
  const [scanRadius, setScanRadius] = React.useState(4600);
  const [hotspotIndex, setHotspotIndex] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'red') return '#ef4444';
    if (urgency === 'amber') return '#f59e0b';
    return '#14b8a6';
  };

  const createDotIcon = (color: string) => L.divIcon({
    className: 'bg-transparent',
    html: `<div class="mm-signal-dot" style="--dot-color:${color}; width: 16px; height: 16px; background: ${color}; border-radius: 50%; box-shadow: 0 0 15px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const merchantIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="mm-merchant-dot" style="width: 24px; height: 24px; background: #fff; border: 4px solid #14b8a6; border-radius: 50%; box-shadow: 0 0 20px #14b8a6;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const competitorIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="mm-competitor-dot" style="width: 14px; height: 14px; background: #FF4B4B; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 8px #FF4B4B;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  const crowdIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="mm-crowd-dot" style="width: 14px; height: 14px; background: #00D1C1; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 8px #00D1C1;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  const mapMessage = mapView === 'regional'
    ? 'REGIONAL MAP — Tracking SEA-level disruptions, commodities & demand shifts.'
    : localMapSize === 'large'
      ? 'LOCAL 5KM — Full view of competitors, businesses & nearby crowd signals.'
      : 'LOCAL 5KM — Compact snapshot for quick competitor awareness.';

  const localCompetitors = LOCAL_COMPETITORS.filter(item => item.type !== 'Shopping Center');
  const localCrowdSpots = LOCAL_COMPETITORS.filter(item => item.type === 'Shopping Center');
  const localHotspots = [...localCompetitors, ...localCrowdSpots];
  const activeHotspot = localHotspots[hotspotIndex % localHotspots.length];

  React.useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    const scanInterval = setInterval(() => {
      setScanRadius(prev => (prev >= 5000 ? 4200 : prev + 120));
    }, 900);
    const hotspotInterval = setInterval(() => {
      setHotspotIndex(prev => (prev + 1) % Math.max(localHotspots.length, 1));
    }, 3500);
    const tickInterval = setInterval(() => setTick(t => t + 1), 2000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(scanInterval);
      clearInterval(hotspotInterval);
      clearInterval(tickInterval);
    };
  }, [localHotspots.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <style>{`
        @keyframes mmPulse {
          0% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.7; }
        }
        @keyframes mmGlowPulse {
          0% { box-shadow: 0 0 8px rgba(20,184,166,0.45); }
          50% { box-shadow: 0 0 24px rgba(20,184,166,1); }
          100% { box-shadow: 0 0 8px rgba(20,184,166,0.45); }
        }
        @keyframes mmScan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes mmDataFlow {
          0% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; }
          100% { opacity: 0.3; transform: translateY(-4px); }
        }
        @keyframes mmBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .mm-signal-dot { animation: mmPulse 1.8s ease-in-out infinite; }
        .mm-merchant-dot { animation: mmGlowPulse 2.2s ease-in-out infinite; }
        .mm-competitor-dot { animation: mmPulse 2.1s ease-in-out infinite; }
        .mm-crowd-dot { animation: mmPulse 1.4s ease-in-out infinite; }

        /* Dark leaflet override */
        .leaflet-container { background: #111318 !important; }
        .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.8); }
        .leaflet-popup-content-wrapper {
          background: #1A1F2E !important;
          border: 1px solid rgba(0,209,193,0.2) !important;
          color: #F8F9FA !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          border-radius: 10px !important;
        }
        .leaflet-popup-tip { background: #1A1F2E !important; }
        .leaflet-popup-close-button { color: #6B7280 !important; }

        /* Scrollbar for bottom panel */
        .mm-scroll::-webkit-scrollbar { height: 4px; }
        .mm-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .mm-scroll::-webkit-scrollbar-thumb { background: rgba(0,209,193,0.3); border-radius: 2px; }
      `}</style>

      {/* Top Bar */}
      <header className="h-14 flex items-center justify-between px-6 shrink-0 z-20" style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs" style={{ color: '#4B5563' }}>{new Date().toISOString().split('T')[0]}</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <span className="uppercase tracking-wider text-xs font-bold" style={{ color: '#00D1C1' }}>Live Intelligence Map</span>
          </div>
          <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => { setMapView('regional'); setSelectedSignal(null); }}
              className="px-2.5 py-1 text-[10px] font-bold rounded transition-all"
              style={{
                background: mapView === 'regional' ? 'rgba(0,209,193,0.15)' : 'transparent',
                color: mapView === 'regional' ? '#00D1C1' : '#6B7280',
              }}
            >
              REGIONAL
            </button>
            <button
              onClick={() => { setMapView('local'); setSelectedSignal(null); }}
              className="px-2.5 py-1 text-[10px] font-bold rounded transition-all"
              style={{
                background: mapView === 'local' ? 'rgba(0,209,193,0.15)' : 'transparent',
                color: mapView === 'local' ? '#00D1C1' : '#6B7280',
              }}
            >
              LOCAL 5KM
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#F8F9FA' }}>{MERCHANT_INFO.businessName}</span>
            <span className="text-sm" style={{ color: '#4B5563' }}>({MERCHANT_INFO.location})</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded" style={{ color: '#00D1C1', background: 'rgba(0,209,193,0.08)', border: '1px solid rgba(0,209,193,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-[#00D1C1] animate-pulse" style={{ boxShadow: '0 0 6px #00D1C1' }} />
            <span>LIVE {now.toUTCString().split(' ')[4]} UTC</span>
          </div>
          <div className="relative cursor-pointer transition-colors" style={{ color: '#4B5563' }}>
            <Bell className="w-5 h-5 opacity-80" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center border-2" style={{ background: '#FF4B4B', borderColor: '#111318' }}>
              {ALERTS.filter(a => a.status === 'pending').length}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex relative">
        {/* Left Agent Panel */}
        <aside className="w-[268px] min-w-[268px] flex flex-col z-20" style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,209,193,0.04)' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4B5563' }}>Active Surveillance</h2>
            <div className="flex items-center gap-1.5" style={{ color: '#00D1C1' }}>
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">4 Active Observers</span>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: '#00D1C1', boxShadow: '0 0 6px #00D1C1' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {AGENTS.map((agent, idx) => {
              const isAlert = agent.status === 'alert';
              const isProcessing = agent.status === 'processing';
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="rounded-lg p-3"
                  style={{
                    background: isAlert
                      ? 'rgba(255,75,75,0.08)'
                      : isProcessing
                        ? 'rgba(0,209,193,0.06)'
                        : 'rgba(255,255,255,0.03)',
                    border: isAlert
                      ? '1px solid rgba(255,75,75,0.25)'
                      : isProcessing
                        ? '1px solid rgba(0,209,193,0.2)'
                        : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm" style={{ color: isAlert ? '#FF4B4B' : isProcessing ? '#00D1C1' : '#6B7280' }}>
                      {agent.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${isProcessing ? 'animate-pulse' : ''}`}
                      style={{
                        background: isProcessing ? '#00D1C1' : isAlert ? '#FF4B4B' : '#374151',
                        boxShadow: isProcessing ? '0 0 6px #00D1C1' : isAlert ? '0 0 6px #FF4B4B' : 'none',
                      }}
                    />
                  </div>
                  {isProcessing && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-[10px] font-mono leading-relaxed rounded p-2 italic"
                      style={{ color: '#00D1C1', background: 'rgba(0,209,193,0.07)', border: '1px solid rgba(0,209,193,0.12)' }}
                    >
                      &gt; {agent.statusText}
                    </motion.div>
                  )}
                  {agent.status === 'idle' && (
                    <div className="text-[10px] font-mono italic" style={{ color: '#374151' }}>
                      IDLE — {agent.statusText}
                    </div>
                  )}
                  {isAlert && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-[10px] font-bold font-mono"
                      style={{ color: '#FF4B4B' }}
                    >
                      ⚠ ALERT ACTIVE
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 min-w-0 relative z-10" style={{ background: '#0A0D13' }}>
          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[1000] backdrop-blur rounded-md px-3 py-2" style={{ background: 'rgba(17,19,24,0.92)', border: '1px solid rgba(0,209,193,0.2)', maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" style={{ color: '#00D1C1' }} />
              <p className="text-[11px] font-semibold" style={{ color: '#9CA3AF' }}>{mapMessage}</p>
            </div>
            {mapView === 'local' && activeHotspot && (
              <motion.p
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[10px] mt-1 font-semibold"
                style={{ color: '#00D1C1' }}
              >
                ◉ Detection: {activeHotspot.name} updated {Math.floor((hotspotIndex % 4) + 1)}s ago
              </motion.p>
            )}
          </div>

          {mapView === 'regional' || localMapSize === 'large' ? (
            <MapContainer
              key={`${mapView}-${localMapSize}`}
              center={mapView === 'regional' ? [7.5, 102.0] : [MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
              zoom={mapView === 'regional' ? 5 : 14}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png" />

              <Marker position={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} icon={merchantIcon}>
                <Popup>
                  <div className="font-bold text-xs uppercase tracking-tight" style={{ color: '#00D1C1' }}>{MERCHANT_INFO.businessName}</div>
                </Popup>
              </Marker>

              {mapView === 'regional' && WORLD_SIGNALS.map(signal => {
                const color = getUrgencyColor(signal.urgency);
                const isActive = selectedSignal === signal.id;

                return (
                  <React.Fragment key={signal.id}>
                    <Marker
                      position={[signal.coords.lat, signal.coords.lng]}
                      icon={createDotIcon(color)}
                      eventHandlers={{ click: () => setSelectedSignal(isActive ? null : signal.id) }}
                    />
                    {(isActive || signal.urgency === 'red') && (
                      <Polyline
                        positions={[
                          [signal.coords.lat, signal.coords.lng],
                          [MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]
                        ]}
                        pathOptions={{
                          color,
                          weight: isActive ? 2 : 1,
                          opacity: isActive ? 0.9 : 0.45,
                          dashArray: '5, 5'
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {mapView === 'local' && (
                <>
                  <Circle
                    center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
                    radius={5000}
                    pathOptions={{ color: '#00D1C1', weight: 2, opacity: 0.7, dashArray: '4 6' }}
                  />
                  <Circle
                    center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
                    radius={scanRadius}
                    pathOptions={{ color: '#00D1C1', weight: 1, opacity: 0.45 }}
                  />
                  {localCompetitors.map(spot => (
                    <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={competitorIcon}>
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">{spot.name}</div>
                          <div style={{ color: '#9CA3AF' }}>{spot.type} • {spot.distance}km</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {localCrowdSpots.map(spot => (
                    <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={crowdIcon}>
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">{spot.name}</div>
                          <div style={{ color: '#9CA3AF' }}>{spot.footTraffic} traffic • {spot.distance}km</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </MapContainer>
          ) : (
            <div className="h-full p-5 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 h-full">
                <div className="h-[280px] rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,209,193,0.2)', boxShadow: '0 0 20px rgba(0,209,193,0.1)' }}>
                  <MapContainer
                    key="local-small"
                    center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
                    zoom={14}
                    className="w-full h-full"
                    zoomControl={false}
                  >
                    <TileLayer url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} icon={merchantIcon} />
                    <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={5000} pathOptions={{ color: '#00D1C1', weight: 2, opacity: 0.7, dashArray: '4 6' }} />
                    <Circle center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} radius={scanRadius} pathOptions={{ color: '#00D1C1', weight: 1, opacity: 0.45 }} />
                    {localCompetitors.map(spot => (
                      <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={competitorIcon} />
                    ))}
                    {localCrowdSpots.map(spot => (
                      <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={crowdIcon} />
                    ))}
                  </MapContainer>
                </div>

                <div className="rounded-xl p-4 overflow-y-auto" style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>5km Local Signals</h3>
                    <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button onClick={() => setLocalMapSize('large')} className="px-2 py-1 text-[10px] font-bold transition-all" style={{ color: '#6B7280' }}>LARGE</button>
                      <button onClick={() => setLocalMapSize('small')} className="px-2 py-1 text-[10px] font-bold rounded" style={{ background: 'rgba(0,209,193,0.15)', color: '#00D1C1' }}>SMALL</button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {LOCAL_COMPETITORS.map(item => (
                      <div
                        key={item.id}
                        className="rounded-lg p-3 transition-all"
                        style={{
                          background: activeHotspot?.id === item.id ? 'rgba(0,209,193,0.07)' : 'rgba(255,255,255,0.03)',
                          border: activeHotspot?.id === item.id ? '1px solid rgba(0,209,193,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: '#F8F9FA' }}>{item.name}</p>
                            <p className="text-[11px]" style={{ color: '#6B7280' }}>{item.type}</p>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: '#4B5563' }}>{item.distance}km</span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: '#6B7280' }}>{item.recentActivity || item.crowd || 'Monitoring activity.'}</p>
                        {activeHotspot?.id === item.id && (
                          <motion.p
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-[10px] mt-1 font-bold"
                            style={{ color: '#00D1C1' }}
                          >
                            ◉ LIVE update detected
                          </motion.p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signal Detail Overlay */}
          <AnimatePresence>
            {mapView === 'regional' && selectedSignal && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="absolute top-6 right-6 w-80 rounded-xl z-[1000] overflow-hidden"
                style={{ background: 'rgba(17,19,24,0.97)', border: '1px solid rgba(0,209,193,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 20px rgba(0,209,193,0.1)', backdropFilter: 'blur(20px)' }}
              >
                {(() => {
                  const signal = WORLD_SIGNALS.find(s => s.id === selectedSignal)!;
                  const color = getUrgencyColor(signal.urgency);
                  return (
                    <div className="p-5">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#00D1C1' }}>
                        {signal.type} Signal
                      </div>
                      <div className="text-xs font-bold mb-1" style={{ color }}>
                        Origin: {signal.origin}
                      </div>
                      <p className="text-[11px] leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>
                        {signal.summary}
                      </p>
                      <div className="rounded-lg p-3 text-xs mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="font-bold text-[10px] uppercase" style={{ color: '#4B5563' }}>Impacting: </span>
                        <span className="font-mono" style={{ color: '#E5E7EB' }}>{signal.impact}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-[10px] font-bold uppercase" style={{ color: '#4B5563' }}>Agent: {signal.agentProcessing}</span>
                        <Target className="w-4 h-4" style={{ color: '#374151' }} />
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Local map size toggle overlay */}
          {mapView === 'local' && (
            <div className="absolute top-4 right-4 z-[1000] rounded-md p-1" style={{ background: 'rgba(17,19,24,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center rounded p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <button
                  onClick={() => setLocalMapSize('large')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded transition-all"
                  style={{ background: localMapSize === 'large' ? 'rgba(0,209,193,0.15)' : 'transparent', color: localMapSize === 'large' ? '#00D1C1' : '#6B7280' }}
                >
                  LARGE
                </button>
                <button
                  onClick={() => setLocalMapSize('small')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded transition-all"
                  style={{ background: localMapSize === 'small' ? 'rgba(0,209,193,0.15)' : 'transparent', color: localMapSize === 'small' ? '#00D1C1' : '#6B7280' }}
                >
                  SMALL
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Panel - Pending Actions */}
      <div className="shrink-0 z-20 flex flex-col" style={{ height: '11rem', background: '#111318', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Header row */}
        <div className="flex-none flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#FF4B4B', boxShadow: '0 0 6px #FF4B4B' }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
              PENDING ACTIONS ({ALERTS.length})
            </span>
          </div>
          <button className="text-[10px] font-bold transition-colors hover:text-white" style={{ color: '#00D1C1' }}>VIEW ALL LOGS →</button>
        </div>

        {/* Scrollable cards row */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden mm-scroll px-4 py-3 flex gap-3 items-stretch min-h-0">
          {ALERTS.map((alert, idx) => {
            const urgencyColor = alert.urgency === 'red' ? '#FF4B4B' : alert.urgency === 'amber' ? '#FFB000' : '#00D1C1';
            const bgColor = alert.urgency === 'red' ? 'rgba(255,75,75,0.06)' : alert.urgency === 'amber' ? 'rgba(255,176,0,0.06)' : 'rgba(0,209,193,0.05)';
            const borderColor = alert.urgency === 'red' ? 'rgba(255,75,75,0.25)' : alert.urgency === 'amber' ? 'rgba(255,176,0,0.25)' : 'rgba(0,209,193,0.2)';
            const isSelected = selectedAlert === alert.id;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-shrink-0 flex flex-col justify-between cursor-pointer rounded-xl p-3 transition-all"
                style={{
                  width: 272,
                  background: isSelected ? `rgba(0,209,193,0.08)` : bgColor,
                  border: `1px solid ${isSelected ? 'rgba(0,209,193,0.4)' : borderColor}`,
                  boxShadow: isSelected ? '0 0 16px rgba(0,209,193,0.15)' : 'none',
                }}
                onClick={() => setSelectedAlert(alert.id === selectedAlert ? null : alert.id)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: bgColor, color: urgencyColor, border: `1px solid ${borderColor}` }}
                    >
                      {alert.agent.split(' ')[0].toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#4B5563' }}>{alert.time}</span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight mb-1" style={{ color: '#F8F9FA' }}>{alert.headline}</h4>
                  <p className="text-[10px] line-clamp-2" style={{ color: '#6B7280' }}>{alert.detail}</p>
                </div>
                {alert.status === 'pending' && (
                  <div className="mt-2.5 flex gap-2">
                    <button
                      className="flex-1 py-1 text-white text-[10px] font-bold rounded uppercase transition-opacity hover:opacity-90"
                      style={{ background: urgencyColor }}
                    >
                      Review
                    </button>
                    <button
                      className="flex-1 py-1 text-[10px] font-bold rounded uppercase transition-all"
                      style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
