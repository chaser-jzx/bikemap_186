"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Location } from "@/data/locations";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

export type TravelMode = "BICYCLING" | "DRIVING" | "WALKING" | "TRANSIT";

export interface RouteRequest {
  origin: string;
  destination: string;
  travelMode?: TravelMode;
}

function FitBounds({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    const g = (window as any).google;
    if (!g) return;

    const bounds = new g.maps.LatLngBounds();
    locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
    map.fitBounds(bounds, 60);
  }, [map, locations]);

  return null;
}

function resolveRackLocation(locations: Location[], name: string | null | undefined) {
  if (!name) return name;
  const match = locations.find((loc) => loc.name.toLowerCase() === name.toLowerCase());
  return match ? { lat: match.lat, lng: match.lng } : name;
}

interface RouteInfo {
  durationText: string;
  distanceText: string;
  nearestPin?: string;
  nearestDistanceText?: string;
  nearestDurationText?: string;
  secondaryRoute?: {
    origin: string;
    destination: string;
    durationText: string;
    distanceText: string;
  };
}

function RouteLayer({
  locations,
  routeRequest,
  onRouteInfo,
}: {
  locations: Location[];
  routeRequest?: RouteRequest | null;
  onRouteInfo?: (info: RouteInfo | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !routeRequest?.origin || !routeRequest?.destination) {
      onRouteInfo && onRouteInfo(null);
      return;
    }

    const g = (window as any).google;
    if (!g?.maps) return;

    const directionsService = new g.maps.DirectionsService();
    const directionsRenderer = new g.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 6,
        strokeOpacity: 0.8,
      },
    });

    // Secondary route renderer for destination to nearest rack
    let secondaryDirectionsRenderer: any = null;
    let customCMarker: any = null;

    const origin = resolveRackLocation(locations, routeRequest.origin);
    const destination = resolveRackLocation(locations, routeRequest.destination);
    const travelMode = g.maps.TravelMode[routeRequest.travelMode ?? "BICYCLING"];

    directionsService.route(
      {
        origin,
        destination,
        travelMode,
      },
      (result: any, status: string) => {
        if (status === "OK" && result.routes.length > 0) {
          directionsRenderer.setDirections(result);
          
          // Ensure end marker for primary route is labeled 'B'
          setTimeout(() => {
            const markers = directionsRenderer.markers;
            if (markers && markers.length >= 2) {
              markers[1].setLabel('B'); // Second marker is the destination
            }
          }, 50);
          
          const leg = result.routes[0].legs[0];
          const routeBaseInfo: RouteInfo = {
            durationText: leg.duration?.text ?? "",
            distanceText: leg.distance?.text ?? "",
          };

          const nearestRackMatch = locations.find((loc) => loc.name.toLowerCase() === routeRequest.destination.toLowerCase());
          if (nearestRackMatch) {
            // Destination is already a rack, no secondary route needed
            onRouteInfo &&
              onRouteInfo({
                ...routeBaseInfo,
                nearestPin: nearestRackMatch.name,
                nearestDistanceText: "0 mi",
                nearestDurationText: "0 min",
              });
          } else {
            // Destination is not a rack, find nearest rack and show secondary route
            const distanceService = new g.maps.DistanceMatrixService();
            distanceService.getDistanceMatrix(
              {
                origins: [routeRequest.destination],
                destinations: locations.map((loc) => ({ lat: loc.lat, lng: loc.lng })),
                travelMode,
                unitSystem: g.maps.UnitSystem.IMPERIAL,
              },
              (matrixResult: any, matrixStatus: string) => {
                if (matrixStatus === "OK" && matrixResult.rows?.[0]?.elements) {
                  const row = matrixResult.rows[0];
                  let bestIndex = -1;
                  let bestDuration = Number.POSITIVE_INFINITY;
                  row.elements.forEach((element: any, index: number) => {
                    if (element.status === "OK" && element.duration?.value < bestDuration) {
                      bestDuration = element.duration.value;
                      bestIndex = index;
                    }
                  });
                  if (bestIndex !== -1) {
                    const nearestRack = locations[bestIndex];

                    // Create secondary route from destination to nearest rack
                    secondaryDirectionsRenderer = new g.maps.DirectionsRenderer({
                      map,
                      suppressMarkers: true, // Suppress default markers, we'll add custom C marker
                      preserveViewport: false,
                      polylineOptions: {
                        strokeColor: '#34A853',
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                      },
                    });

                    // Create custom marker for the rack with label 'C'
                    directionsService.route(
                      {
                        origin: routeRequest.destination,
                        destination: { lat: nearestRack.lat, lng: nearestRack.lng },
                        travelMode,
                      },
                      (secondaryResult: any, secondaryStatus: string) => {
                        if (secondaryStatus === "OK" && secondaryResult.routes.length > 0) {
                          secondaryDirectionsRenderer.setDirections(secondaryResult);
                          
                          // Add custom marker at the rack with label 'C'
                          if (!customCMarker) {
                            customCMarker = new g.maps.Marker({
                              position: { lat: nearestRack.lat, lng: nearestRack.lng },
                              map,
                              label: 'C',
                              title: nearestRack.name
                            });
                          }
                          
                          const secondaryLeg = secondaryResult.routes[0].legs[0];

                          onRouteInfo &&
                            onRouteInfo({
                              ...routeBaseInfo,
                              nearestPin: nearestRack.name,
                              nearestDistanceText: row.elements[bestIndex].distance?.text ?? "",
                              nearestDurationText: row.elements[bestIndex].duration?.text ?? "",
                              secondaryRoute: {
                                origin: routeRequest.destination,
                                destination: nearestRack.name,
                                durationText: secondaryLeg.duration?.text ?? "",
                                distanceText: secondaryLeg.distance?.text ?? "",
                              },
                            });
                        } else {
                          onRouteInfo &&
                            onRouteInfo({
                              ...routeBaseInfo,
                              nearestPin: nearestRack.name,
                              nearestDistanceText: row.elements[bestIndex].distance?.text ?? "",
                              nearestDurationText: row.elements[bestIndex].duration?.text ?? "",
                            });
                        }
                      }
                    );
                  } else {
                    onRouteInfo && onRouteInfo(routeBaseInfo);
                  }
                } else {
                  onRouteInfo && onRouteInfo(routeBaseInfo);
                }
              }
            );
          }
        } else {
          console.error("Directions request failed:", status);
          directionsRenderer.setDirections({ routes: [] } as any);
          onRouteInfo && onRouteInfo(null);
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
      if (secondaryDirectionsRenderer) {
        secondaryDirectionsRenderer.setMap(null);
      }
      if (customCMarker) {
        customCMarker.setMap(null);
      }
      onRouteInfo && onRouteInfo(null);
    };
  }, [map, locations, routeRequest, onRouteInfo]);

  return null;
}

interface MapContentProps {
  locations: Location[];
  selectedId?: string | null;
  routeRequest?: RouteRequest | null;
  onClearSelect?: () => void;
  onSelect?: (id: string) => void;
  onRouteTo?: (destination: string) => void;
}

function MapContent({ locations, selectedId, routeRequest, onClearSelect, onSelect, onRouteTo }: MapContentProps) {
  const visible = locations;
  const map = useMap();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!selectedId) return;

    const loc = locations.find((l) => l.id === selectedId);
    if (!loc) return;

    // Center and zoom to the selected location
    map.panTo({ lat: loc.lat, lng: loc.lng });
    try {
      map.setZoom(15);
    } catch (e) {
      // ignore if setZoom unavailable
    }
  }, [map, selectedId, locations]);

  const selected = selectedId ? locations.find((l) => l.id === selectedId) ?? null : null;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        defaultCenter={SF_CENTER}
        defaultZoom={13}
        onClick={() => onClearSelect && onClearSelect()}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ height: '100%', width: '100%' }}
      >
      {visible.map((loc) => (
        <Marker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
          onClick={() => onSelect && onSelect(loc.id)}
        />
      ))}

      <RouteLayer locations={locations} routeRequest={routeRequest} onRouteInfo={setRouteInfo} />

      {!selectedId && !routeRequest && visible.length > 0 && <FitBounds locations={visible} />}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onClearSelect && onClearSelect()}
        >
          <div className="max-w-[220px]">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-lg font-semibold">{selected.name}</strong>
              <button
                type="button"
                onClick={() => onRouteTo && onRouteTo(selected.name)}
                className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Directions
              </button>
            </div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {selected.capacity - (selected.occupied ?? 0)}/{selected.capacity} spaces available
            </div>
          </div>
        </InfoWindow>
      )}
      </GoogleMap>
      {routeInfo && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-[320px] rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 text-sm text-zinc-900 shadow-lg backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-zinc-100">
          <div className="font-semibold">Biking route</div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span>{routeInfo.durationText}</span>
            <span>{routeInfo.distanceText}</span>
          </div>
          {routeInfo.secondaryRoute && (
            <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
              <div className="font-medium">To nearest bicycle rack</div>
              <div className="mt-1 text-[11px]">
                <div className="font-semibold">{routeInfo.secondaryRoute.destination}</div>
                <div className="mt-1 text-[11px] text-green-600 dark:text-green-400">
                  {routeInfo.secondaryRoute.durationText} • {routeInfo.secondaryRoute.distanceText}
                </div>
              </div>
            </div>
          )}
          {routeInfo.nearestPin && !routeInfo.secondaryRoute && (
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              <div className="font-medium">Nearest bicycle rack</div>
              <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                {routeInfo.nearestPin}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {routeInfo.nearestDurationText} • {routeInfo.nearestDistanceText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MapProps {
  locations: Location[];
  selectedId?: string | null;
  routeRequest?: RouteRequest | null;
  onClearSelect?: () => void;
  onSelect?: (id: string) => void;
  onRouteTo?: (destination: string) => void;
}

export default function Map({ locations, selectedId, routeRequest, onClearSelect, onSelect, onRouteTo }: MapProps) {
  return (
    <APIProvider apiKey={API_KEY} libraries={["places"]}>
      <MapContent
        locations={locations}
        selectedId={selectedId}
        routeRequest={routeRequest}
        onClearSelect={onClearSelect}
        onSelect={onSelect}
        onRouteTo={onRouteTo}
      />
    </APIProvider>
  );
}
