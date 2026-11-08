import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar, Folder, FileText } from 'lucide-react';

// Custom Leaflet marker icons
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapPoint {
  id: string;
  case_id?: number;
  event_type: string;
  description: string;
  timestamp?: string;
  location_name: string;
  address?: string;
  latitude: number;
  longitude: number;
  source_document_id?: number;
}

interface MapViewerProps {
  points: MapPoint[];
  height?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({ points, height = 'h-[600px]' }) => {
  const defaultCenter: [number, number] = points.length > 0
    ? [points[0].latitude, points[0].longitude]
    : [12.9716, 77.5946]; // Default Bengaluru coordinates

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl`}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((pt) => (
          <Marker
            key={pt.id}
            position={[pt.latitude, pt.longitude]}
            icon={customMarkerIcon}
          >
            <Popup>
              <div className="p-1 min-w-[200px] text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-sm mb-1">
                  <MapPin className="w-4 h-4 shrink-0 text-cyan-500" />
                  <span>{pt.location_name}</span>
                </div>

                <p className="text-slate-300 font-medium mb-2">{pt.description}</p>

                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-700/60 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>Case Ref: <strong>CASE-{pt.case_id || 'GENERAL'}</strong></span>
                  </div>

                  {pt.timestamp && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(pt.timestamp).toLocaleString()}</span>
                    </div>
                  )}

                  {pt.address && (
                    <div className="text-[10px] text-slate-400 italic mt-1">
                      {pt.address}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
