import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { MapViewer } from '../components/map/MapViewer';
import { Disclaimer } from '../components/common/Disclaimer';

export const MapPage: React.FC = () => {
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      try {
        const events = await analyticsService.getMapEvents();
        setMapPoints(events);
      } catch (err) {
        console.error('Failed to load map events', err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Geographic Map Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">Interactive OpenStreetMap geo-tagged surveillance points and case location markers</p>
      </div>

      <Disclaimer compact />

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading geographic map layers...</div>
      ) : (
        <MapViewer points={mapPoints} height="h-[700px]" />
      )}
    </div>
  );
};
