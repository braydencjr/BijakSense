import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MERCHANT_INFO, LOCAL_COMPETITORS } from '../data/mock';

const CompetitorIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
  </svg>
);

export default function LocalCompetitorMap() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<typeof LOCAL_COMPETITORS[0] | null>(null);

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#3b82f6';
      case 'opportunity':
        return '#10b981';
      default:
        return '#8b5cf6';
    }
  };

  const getThreatLabel = (threat: string) => {
    switch (threat) {
      case 'critical':
        return '🔴 CRITICAL';
      case 'high':
        return '🟠 HIGH THREAT';
      case 'medium':
        return '🟡 MEDIUM';
      case 'low':
        return '🔵 LOW THREAT';
      case 'opportunity':
        return '🟢 OPPORTUNITY';
      default:
        return '🟣 MONITOR';
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <style>{`
        .leaflet-container {
          background: #0f172a !important;
        }
        .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.9);
        }
        .competitor-marker {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .merchant-marker {
          animation: glow 3s infinite;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
        }
        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(34, 197, 94, 1));
          }
        }
      `}</style>
      
      <MapContainer 
        center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]} 
        zoom={14} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* 5km Radius Circle */}
        <CircleMarker
          center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
          radius={5000 / 111} // Convert km to lat/lng degrees (rough)
          fill={false}
          color="#00d4ff"
          weight={1}
          opacity={0.3}
          dashArray="5, 5"
        />

        {/* Merchant Location */}
        <CircleMarker
          center={[MERCHANT_INFO.coordinates.lat, MERCHANT_INFO.coordinates.lng]}
          radius={8}
          fill={true}
          fillColor="#22c55e"
          fillOpacity={0.9}
          color="#16a34a"
          weight={3}
          className="merchant-marker"
        >
          <Popup className="custom-popup">
            <div className="text-xs">
              <p className="font-bold text-green-600">{MERCHANT_INFO.businessName}</p>
              <p className="text-neutral-600">Your Location</p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Competitors */}
        {LOCAL_COMPETITORS.map((comp) => (
          <CircleMarker
            key={comp.id}
            center={[comp.coordinates.lat, comp.coordinates.lng]}
            radius={comp.threat === 'critical' ? 10 : comp.threat === 'high' ? 8 : comp.threat === 'opportunity' ? 7 : 6}
            fill={true}
            fillColor={getThreatColor(comp.threat)}
            fillOpacity={0.8}
            color={getThreatColor(comp.threat)}
            weight={2}
            className="competitor-marker"
            eventHandlers={{
              click: () => setSelectedCompetitor(comp),
            }}
          >
            <Popup className="custom-popup">
              <div className="text-xs max-w-xs">
                <p className="font-bold text-neutral-900">{comp.name}</p>
                <p className="text-neutral-600">{comp.type}</p>
                {comp.distance && <p className="text-neutral-500">{comp.distance}km away</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Selected Competitor Detail Panel */}
      {selectedCompetitor && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-slate-700 p-4 max-h-40 overflow-y-auto">
          <div className="max-w-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-semibold">{selectedCompetitor.name}</p>
                <p className="text-slate-400 text-xs">{selectedCompetitor.type}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-slate-800 text-slate-200 rounded">
                {selectedCompetitor.distance}km
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg">{getThreatLabel(selectedCompetitor.threat)}</span>
            </div>
            {selectedCompetitor.menuItems && (
              <p className="text-xs text-slate-400 mt-2">
                <span className="font-semibold text-slate-300">Menu:</span> {selectedCompetitor.menuItems.join(', ')}
              </p>
            )}
            {selectedCompetitor.recentActivity && (
              <p className="text-xs text-slate-400 mt-1">
                <span className="font-semibold text-slate-300">Activity:</span> {selectedCompetitor.recentActivity}
              </p>
            )}
            {selectedCompetitor.crowd && (
              <p className="text-xs text-slate-400 mt-1">
                <span className="font-semibold text-slate-300">Traffic:</span> {selectedCompetitor.crowd}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
