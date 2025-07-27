
'use client';

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, TrafficLayer, Polyline, HeatmapLayer } from '@react-google-maps/api';
import { CustomMapPin } from './custom-map-pin';
import { Droplets, Car, PowerOff, AlertTriangle, Construction, TreeDeciduous, TrafficCone, Home, School } from 'lucide-react';
import { Incident } from '@/lib/types';

const defaultContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const getPixelPositionOffset = (width: number, height: number) => ({
  x: -(width / 2),
  y: -(height / 2),
});

const categoryStyles: { [key: string]: { icon: React.ElementType; className: string } } = {
    'Water Logging': { icon: Droplets, className: 'bg-blue-100 border-blue-500 text-blue-500' },
    'Road Accidents': { icon: Car, className: 'bg-red-100 border-red-500 text-red-500' },
    'Accident': { icon: Car, className: 'bg-red-100 border-red-500 text-red-500' },
    'Fire Accidents': { icon: TrafficCone, className: 'bg-orange-100 border-orange-500 text-orange-500' },
    'Electrical Issues': { icon: PowerOff, className: 'bg-yellow-100 border-yellow-500 text-yellow-500' },
    'PowerCut': { icon: PowerOff, className: 'bg-yellow-100 border-yellow-500 text-yellow-500' },
    'Drainage/Fallen Tree': { icon: TreeDeciduous, className: 'bg-green-100 border-green-500 text-green-500' },
    'Road Blockages': { icon: TrafficCone, className: 'bg-gray-100 border-gray-500 text-gray-500' },
    'Construction Zones': { icon: Construction, className: 'bg-indigo-100 border-indigo-500 text-indigo-500' },
    'Home': { icon: Home, className: 'bg-green-100 border-green-500 text-green-500' },
    'School': { icon: School, className: 'bg-blue-100 border-blue-500 text-blue-500' },
    'Other': { icon: AlertTriangle, className: 'bg-purple-100 border-purple-500 text-purple-500' },
};

interface MapComponentProps {
  incidents: Incident[];
  onPinClick: (incident: Incident) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMapLoad?: (isLoaded: boolean) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  containerStyle?: React.CSSProperties;
  showTraffic?: boolean;
  routePolyline?: string;
  aqiHeatmap?: boolean;
  incidentHeatmap?: boolean;
}

export function MapComponent({ 
  incidents,
  onPinClick,
  onMapClick,
  onMapLoad,
  center = defaultCenter,
  zoom = 12,
  containerStyle = defaultContainerStyle,
  showTraffic = false,
  routePolyline,
  aqiHeatmap = false,
  incidentHeatmap = false,
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: ['places', 'routes', 'geometry', 'geocoding', 'visualization'],
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    if (onMapLoad) {
      onMapLoad(true);
    }
  }, [onMapLoad]);
  
  useEffect(() => {
    if(onMapLoad) onMapLoad(isLoaded);
  }, [isLoaded, onMapLoad]);
  
  const decodedPath = useMemo(() => {
    if (isLoaded && routePolyline && window.google?.maps?.geometry?.encoding) {
        return window.google.maps.geometry.encoding.decodePath(routePolyline);
    }
    return [];
  }, [isLoaded, routePolyline]);

  const incidentHeatmapData = useMemo(() => {
      if(!isLoaded || !window.google?.maps?.visualization) return [];
      return incidents.map(incident => new google.maps.LatLng(incident.location.latitude, incident.location.longitude));
  }, [incidents, isLoaded]);

  useEffect(() => {
    if (mapInstance && isLoaded) {
      mapInstance.overlayMapTypes.clear();

      if (aqiHeatmap) {
        const aqiTileLayer = new google.maps.ImageMapType({
          getTileUrl: function(coord, zoom) {
            const url = `https://airquality.googleapis.com/v1/mapTypes/UAQI_RED_GREEN/heatmapTiles/${zoom}/${coord.x}/${coord.y}?key=${apiKey}`;
            return url;
          },
          tileSize: new google.maps.Size(256, 256),
          name: 'AQI Heatmap'
        });
        mapInstance.overlayMapTypes.insertAt(0, aqiTileLayer);
      }
    }
    return () => {
      if (mapInstance) {
        mapInstance.overlayMapTypes.clear();
      }
    };
  }, [mapInstance, isLoaded, aqiHeatmap, apiKey]);


  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-destructive">
          Error loading maps.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
       <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p>Loading Map...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-destructive">
          Google Maps API key is missing. Please add it to your .env file.
        </p>
      </div>
    );
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom} onClick={onMapClick} onLoad={handleMapLoad}>
      {incidents.map(incident => {
          const style = categoryStyles[incident.category] || categoryStyles['Other'];
          if (!style) return null;
          return (
            <OverlayView
              key={incident.id}
              position={{ lat: incident.location.latitude, lng: incident.location.longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={getPixelPositionOffset}
            >
              <div onClick={() => onPinClick(incident)} style={{cursor: 'pointer'}}>
                <CustomMapPin icon={style.icon} className={style.className} />
              </div>
            </OverlayView>
          )
      })}
      {showTraffic && <TrafficLayer autoUpdate />}
      {decodedPath.length > 0 && (
        <Polyline
            path={decodedPath}
            options={{
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 4,
            }}
        />
      )}
      {incidentHeatmap && incidentHeatmapData.length > 0 && (
          <HeatmapLayer
            data={incidentHeatmapData}
            options={{
                radius: 20,
                opacity: 0.6
            }}
          />
      )}
    </GoogleMap>
  );
}
