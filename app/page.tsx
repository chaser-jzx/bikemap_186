"use client";

import { FormEvent, useEffect, useState } from "react";
import { locations } from "@/data/locations";
import Map, { RouteRequest } from "@/app/components/Map";

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<string>("");
  const [routeDestination, setRouteDestination] = useState<string>("");
  const [routeRequest, setRouteRequest] = useState<RouteRequest | null>(null);
  const [routePlannerOpen, setRoutePlannerOpen] = useState<boolean>(false);
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [rackQuery, setRackQuery] = useState<string>("");
  const [rackSuggestions, setRackSuggestions] = useState<string[]>([]);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);

  function handleSelect(id: string) {
    setSelectedId(id);
  }

  function clearSelect() {
    setSelectedId(null);
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      const g = (window as any).google;
      if (g?.maps?.places) {
        setAutocompleteService(new g.maps.places.AutocompleteService());
        window.clearInterval(interval);
      }
    }, 300);
    return () => window.clearInterval(interval);
  }, []);

  function handleRouteInput(value: string, setValue: (value: string) => void, setSuggestions: (items: string[]) => void) {
    setValue(value);
    if (autocompleteService && value.length > 1) {
      autocompleteService.getPlacePredictions({ input: value }, (predictions: any, status: string) => {
        if (status === "OK" && predictions) {
          setSuggestions(predictions.map((prediction: any) => prediction.description));
        } else {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  }

  function selectOriginSuggestion(value: string) {
    setRouteOrigin(value);
    setOriginSuggestions([]);
  }

  function selectDestinationSuggestion(value: string) {
    setRouteDestination(value);
    setDestinationSuggestions([]);
  }

  function handleRackQueryInput(value: string) {
    setRackQuery(value);
    const filtered = locations
      .map((loc) => loc.name)
      .filter((name) => name.toLowerCase().includes(value.toLowerCase()));
    setRackSuggestions(filtered);
  }

  function selectRackSuggestion(value: string) {
    setRackQuery(value);
    setRackSuggestions([]);
    handleRouteTo(value);
  }

  function handleRouteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!routeOrigin || !routeDestination) return;
    setRouteRequest({ origin: routeOrigin, destination: routeDestination, travelMode: "BICYCLING" });
  }

  function clearRoute() {
    setRouteRequest(null);
    setRouteOrigin("");
    setRouteDestination("");
    setRackQuery("");
    setRackSuggestions([]);
  }

  function toggleRoutePlanner() {
    setRoutePlannerOpen((open) => !open);
  }

  function handleRouteTo(destination: string) {
    setRouteDestination(destination);
    if (routeOrigin) {
      setRouteRequest({ origin: routeOrigin, destination, travelMode: "BICYCLING" });
    }
  }

  // selectedLoc removed from sidebar - details will be shown on the map InfoWindow

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-80 md:border-b-0 md:border-r">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight">Bike Map</h1>
        </div>
        <div className="mb-6 overflow-visible rounded-2xl border border-zinc-200 bg-zinc-50 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={toggleRoutePlanner}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <span className={`inline-block transition-transform ${routePlannerOpen ? "rotate-90" : ""}`}>▶</span>
            Route planner
          </button>
          {routePlannerOpen && (
            <form onSubmit={handleRouteSubmit} className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Origin
                  <div className="relative">
                    <input
                      value={routeOrigin}
                      onChange={(event) => handleRouteInput(event.target.value, setRouteOrigin, setOriginSuggestions)}
                      placeholder="Origin"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                    {originSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-44 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                        {originSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => selectOriginSuggestion(suggestion)}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Destination
                  <div className="relative">
                    <input
                      value={routeDestination}
                      onChange={(event) => handleRouteInput(event.target.value, setRouteDestination, setDestinationSuggestions)}
                      placeholder="Destination"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                    {destinationSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-44 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                        {destinationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => selectDestinationSuggestion(suggestion)}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  <p className="mb-2 font-semibold">Or choose a rack</p>
                  <div className="relative">
                    <input
                      value={rackQuery}
                      onFocus={() => setRackSuggestions(locations.map((loc) => loc.name))}
                      onChange={(event) => handleRackQueryInput(event.target.value)}
                      placeholder="Select a rack"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                    {rackSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                        {rackSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => selectRackSuggestion(suggestion)}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex flex-1 justify-center rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Show route
                  </button>
                  <button
                    type="button"
                    onClick={clearRoute}
                    className="inline-flex flex-1 justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Use a pin name or any Google Maps place/address.
                </p>
              </div>
            </form>
          )}
        </div>
        <ul className="space-y-1">
          {locations.map((loc) => {
            const active = selectedId === loc.id;
            return (
              <li key={loc.id}>
                <button
                  onClick={() => handleSelect(loc.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-sm font-medium">{loc.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {/* details moved to map InfoWindow */}
      </aside>

      {/* Map */}
      <main className="relative flex-1">
        <Map
          locations={locations}
          selectedId={selectedId}
          routeRequest={routeRequest}
          onClearSelect={clearSelect}
          onSelect={handleSelect}
          onRouteTo={handleRouteTo}
        />
      </main>
    </div>
  );
}
