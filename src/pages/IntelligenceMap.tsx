import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Activity, Target } from 'lucide-react';
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

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'red') return '#ef4444';
    if (urgency === 'amber') return '#f59e0b';
    return '#14b8a6'; // teal
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
    ? 'Large map: Tracking SEA-level disruptions, commodities, and demand shifts.'
    : localMapSize === 'large'
      ? 'Large 5km map: Full local view of competitors, businesses, and nearby crowd signals.'
      : 'Small 5km map: Compact local snapshot for quick competitor awareness.';

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

    return () => {
      clearInterval(clockInterval);
      clearInterval(scanInterval);
      clearInterval(hotspotInterval);
    };
  }, [localHotspots.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F8F9FA] text-[#1A1A1A] relative overflow-hidden">
      <style>{`
        @keyframes mmPulse {
          0% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.7; }
        }
        @keyframes mmGlowPulse {
          0% { box-shadow: 0 0 8px rgba(20,184,166,0.45); }
          50% { box-shadow: 0 0 18px rgba(20,184,166,0.9); }
          100% { box-shadow: 0 0 8px rgba(20,184,166,0.45); }
        }
        .mm-signal-dot { animation: mmPulse 1.8s ease-in-out infinite; }
        .mm-merchant-dot { animation: mmGlowPulse 2.2s ease-in-out infinite; }
        .mm-competitor-dot { animation: mmPulse 2.1s ease-in-out infinite; }
        .mm-crowd-dot { animation: mmPulse 1.4s ease-in-out infinite; }
      `}</style>
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center text-sm text-gray-500 font-medium gap-3">
          <span className="font-mono">{new Date().toISOString().split('T')[0]}</span>
          <span className="text-gray-300">|</span>
          <span className="uppercase tracking-wider text-xs font-bold text-[#00D1C1]">Live Intelligence Map</span>
          <div className="ml-2 flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => {
                setMapView('regional');
                setSelectedSignal(null);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded ${mapView === 'regional' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              LARGE MAP
            </button>
            <button
              onClick={() => {
                setMapView('local');
                setSelectedSignal(null);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded ${mapView === 'local' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              SMALL 5KM MAP
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-sm">
            <span className="font-semibold text-gray-900">{MERCHANT_INFO.businessName}</span>
            <span className="ml-2 text-gray-500">({MERCHANT_INFO.location})</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-[#00D1C1] animate-pulse" />
            <span>LIVE {now.toUTCString().split(' ')[4]} UTC</span>
          </div>
          <div className="relative cursor-pointer hover:text-[#00D1C1] transition-colors text-gray-400">
            <Bell className="w-5 h-5 opacity-80" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF4B4B] border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {ALERTS.filter(a => a.status === 'pending').length}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex relative">
        {/* Left Agent Panel */}
        <aside className="w-[280px] min-w-[280px] bg-white border-r border-gray-200 flex flex-col z-20">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Active Surveillance</h2>
            <div className="flex items-center mt-2 text-[#00D1C1]">
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-semibold">4 Active Observers</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {AGENTS.map(agent => {
              const urgencyColor = agent.status === 'alert' ? 'bg-[#FF4B4B]' : agent.status === 'processing' ? 'bg-[#00D1C1]' : 'bg-gray-300';
              const cardBg = agent.status === 'alert' ? 'bg-[#FFF5F5] border-[#FF4B4B]/20' : agent.status === 'processing' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500';

              return (
                <div key={agent.id} className={`border rounded-lg p-3 transition-all ${cardBg}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">{agent.name}</span>
                    <div className={`w-2 h-2 rounded-full ${urgencyColor} ${agent.status === 'processing' ? 'animate-pulse' : ''}`} />
                  </div>
                  {agent.status === 'processing' && (
                    <div className="text-[10px] text-gray-600 font-mono leading-relaxed bg-gray-50 border border-gray-100 p-2 rounded italic">
                      &gt; {agent.statusText}
                    </div>
                  )}
                  {agent.status === 'idle' && (
                    <div className="text-[10px] text-gray-400 font-mono italic">
                      IDLE - {agent.statusText}
                    </div>
                  )}
                  {agent.status === 'alert' && (
                    <div className="text-[10px] text-[#FF4B4B] font-bold font-mono">
                      ALERT ACTIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 min-w-0 relative bg-[#E2E8F0] z-10">
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur border border-gray-200 rounded-md px-3 py-2 shadow-sm max-w-[520px]">
            <p className="text-[11px] font-semibold text-gray-600">{mapMessage}</p>
            {mapView === 'local' && activeHotspot && (
              <p className="text-[10px] mt-1 text-[#00A69A] font-semibold">
                Detection: {activeHotspot.name} updated {Math.floor((hotspotIndex % 4) + 1)}s ago.
              </p>
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
              <TileLayer
                url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
              />

              <Marker position={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} icon={merchantIcon}>
                <Popup className="bg-white text-gray-900 border border-gray-200">
                  <div className="text-[#1A1A1A] font-bold text-xs uppercase tracking-tight">{MERCHANT_INFO.businessName}</div>
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
                          opacity: isActive ? 0.8 : 0.4,
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
                    <Marker
                      key={spot.id}
                      position={[spot.coordinates.lat, spot.coordinates.lng]}
                      icon={competitorIcon}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold text-[#1A1A1A]">{spot.name}</div>
                          <div className="text-gray-500">{spot.type} • {spot.distance}km</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {localCrowdSpots.map(spot => (
                    <Marker
                      key={spot.id}
                      position={[spot.coordinates.lat, spot.coordinates.lng]}
                      icon={crowdIcon}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold text-[#1A1A1A]">{spot.name}</div>
                          <div className="text-gray-500">{spot.footTraffic} traffic • {spot.distance}km</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </MapContainer>
          ) : (
            <div className="h-full p-6 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 h-full">
                <div className="h-[280px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <MapContainer
                    key="local-small"
                    center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
                    zoom={14}
                    className="w-full h-full"
                    zoomControl={false}
                  >
                    <TileLayer url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} icon={merchantIcon} />
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
                      <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={competitorIcon} />
                    ))}
                    {localCrowdSpots.map(spot => (
                      <Marker key={spot.id} position={[spot.coordinates.lat, spot.coordinates.lng]} icon={crowdIcon} />
                    ))}
                  </MapContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">5km Local Signals</h3>
                    <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
                      <button
                        onClick={() => setLocalMapSize('large')}
                        className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700"
                      >
                        LARGE
                      </button>
                      <button
                        onClick={() => setLocalMapSize('small')}
                        className="px-2 py-1 text-[10px] font-bold bg-white rounded shadow-sm text-[#1A1A1A]"
                      >
                        SMALL
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {LOCAL_COMPETITORS.map(item => (
                      <div key={item.id} className={`border rounded-lg p-3 transition-colors ${activeHotspot?.id === item.id ? 'border-[#00D1C1]/40 bg-[#F0FBFA]' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]">{item.name}</p>
                            <p className="text-[11px] text-gray-500">{item.type}</p>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{item.distance}km</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{item.recentActivity || item.crowd || 'Monitoring activity.'}</p>
                        {activeHotspot?.id === item.id && (
                          <p className="text-[10px] mt-1 text-[#00A69A] font-bold">LIVE update detected</p>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-6 right-6 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg shadow-xl z-[1000] overflow-hidden"
              >
                {(() => {
                  const signal = WORLD_SIGNALS.find(s => s.id === selectedSignal)!;
                  const colorMatch = { red: 'text-[#FF4B4B] border-[#FF4B4B]/20 bg-[#FFF5F5]', amber: 'text-[#FFB000] border-[#FFB000]/20 bg-[#FFF9F0]', teal: 'text-[#00D1C1] border-[#00D1C1]/20 bg-[#F0FBFA]' }[signal.urgency];
                  
                  return (
                    <div className="p-5 relative text-[#1A1A1A]">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#00D1C1] mb-2">
                        {signal.type} Signal
                      </div>
                      <div className={`text-xs font-bold mb-1 ${colorMatch.split(' ')[0]}`}>
                        Origin: {signal.origin}
                      </div>
                      <p className="text-gray-500 text-[10px] leading-relaxed mb-4">
                        {signal.summary}
                      </p>
                      
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs mb-4">
                        <span className="text-gray-400 font-bold text-[10px] uppercase">Impacting: </span>
                        <span className="font-mono text-gray-700">{signal.impact}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Agent: {signal.agentProcessing}</span>
                        <Target className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {mapView === 'local' && (
            <div className="absolute top-4 right-4 z-[1000] bg-white border border-gray-200 rounded-md p-1.5 shadow-sm">
              <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
                <button
                  onClick={() => setLocalMapSize('large')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded ${localMapSize === 'large' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  LARGE
                </button>
                <button
                  onClick={() => setLocalMapSize('small')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded ${localMapSize === 'small' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  SMALL
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Panel - Recommendations Strip */}
      <div className="h-44 bg-white/95 backdrop-blur-md border-t border-gray-200 shrink-0 z-20 overflow-hidden flex flex-col">
        <div className="p-2 border-b border-gray-100 flex justify-between items-center px-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PENDING ACTIONS ({ALERTS.length})</span>
          <button className="text-[10px] text-[#00D1C1] font-bold hover:underline">VIEW ALL LOGS →</button>
        </div>
        <div className="flex-1 overflow-x-auto p-4 flex gap-4 w-full">
          {ALERTS.map(alert => {
            const urgencyClass = {
              red: 'border-[#FF4B4B]/20 bg-white text-[#FF4B4B]',
              amber: 'border-[#FFB000]/20 bg-white text-[#FFB000]',
              green: 'border-[#00D1C1]/20 bg-white text-[#00D1C1]'
            }[alert.urgency];

            const badgeBg = {
              red: 'bg-[#FFF5F5]',
              amber: 'bg-[#FFF9F0]',
              green: 'bg-[#F0FBFA]'
            }[alert.urgency];

            return (
              <div
                key={alert.id} 
                className={`flex-shrink-0 min-w-[280px] border ${urgencyClass} rounded-xl p-3 cursor-pointer flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md ${selectedAlert === alert.id ? 'ring-2 ring-[#00D1C1]/30' : ''}`}
                onClick={() => setSelectedAlert(alert.id)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
                      {alert.agent.split(' ')[0].toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{alert.time}</span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight mb-1 text-[#1A1A1A]">{alert.headline}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{alert.detail}</p>
                </div>
                {alert.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button className={`flex-1 py-1.5 text-white text-[10px] border-0 font-bold rounded uppercase ${alert.urgency === 'red' ? 'bg-[#FF4B4B]' : alert.urgency === 'amber' ? 'bg-gray-900' : 'bg-[#00D1C1]'}`}>Review</button>
                    <button className="flex-1 py-1.5 border border-gray-200 text-gray-500 text-[10px] font-bold rounded uppercase hover:bg-gray-50">Dismiss</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
