"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Location } from "@/data/locations";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

function FitBounds({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
    map.fitBounds(bounds, 60);
  }, [map, locations]);

  return null;
}

interface MapContentProps {
  locations: Location[];
  activeIds: Set<string>;
}

function MapContent({ locations, activeIds }: MapContentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visible = locations.filter((loc) => activeIds.has(loc.id));
  const selected = visible.find((loc) => loc.id === selectedId);

  return (
    <GoogleMap
      defaultCenter={SF_CENTER}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId="bikemap"
      className="h-full w-full"
    >
      {visible.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
          onClick={() => setSelectedId(loc.id)}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelectedId(null)}
        >
          <div className="max-w-[200px]">
            <strong className="text-sm">{selected.name}</strong>
            {selected.description && (
              <p className="mt-1 text-xs text-zinc-600">
                {selected.description}
              </p>
            )}
          </div>
        </InfoWindow>
      )}

      {visible.length > 0 && <FitBounds locations={visible} />}
    </GoogleMap>
  );
}

interface MapProps {
  locations: Location[];
  activeIds: Set<string>;
}

export default function Map({ locations, activeIds }: MapProps) {
  return (
    <APIProvider apiKey={API_KEY}>
      <MapContent locations={locations} activeIds={activeIds} />
    </APIProvider>
  );
}
