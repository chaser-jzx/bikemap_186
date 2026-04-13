"use client";

import { useState } from "react";
import { locations } from "@/data/locations";
import Map from "@/app/components/Map";

export default function Home() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (activeIds.size === locations.length) {
      setActiveIds(new Set());
    } else {
      setActiveIds(new Set(locations.map((l) => l.id)));
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-80 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Bike Map</h1>
          <button
            onClick={toggleAll}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {activeIds.size === locations.length ? "Clear All" : "Show All"}
          </button>
        </div>
        <ul className="space-y-1">
          {locations.map((loc) => {
            const active = activeIds.has(loc.id);
            return (
              <li key={loc.id}>
                <button
                  onClick={() => toggle(loc.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                        active
                          ? "border-blue-500 bg-blue-500"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    />
                    <span className="text-sm font-medium">{loc.name}</span>
                  </span>
                  {loc.description && (
                    <p className="mt-0.5 pl-[18px] text-xs text-zinc-500 dark:text-zinc-400">
                      {loc.description}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Map */}
      <main className="relative flex-1">
        <Map locations={locations} activeIds={activeIds} />
      </main>
    </div>
  );
}
