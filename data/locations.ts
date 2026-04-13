export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

export const locations: Location[] = [
  {
    id: "1",
    name: "Golden Gate Bridge Vista Point",
    lat: 37.8077,
    lng: -122.4750,
    description: "Iconic bridge with stunning bay views",
  },
  {
    id: "2",
    name: "Crissy Field",
    lat: 37.8039,
    lng: -122.4638,
    description: "Waterfront park with bike paths along the bay",
  },
  {
    id: "3",
    name: "Ferry Building",
    lat: 37.7955,
    lng: -122.3937,
    description: "Historic marketplace on the Embarcadero",
  },
  {
    id: "4",
    name: "Dolores Park",
    lat: 37.7596,
    lng: -122.4269,
    description: "Popular hilltop park with city skyline views",
  },
  {
    id: "5",
    name: "Twin Peaks",
    lat: 37.7544,
    lng: -122.4477,
    description: "Panoramic 360-degree views of the city",
  },
  {
    id: "6",
    name: "Fisherman's Wharf",
    lat: 37.8080,
    lng: -122.4177,
    description: "Bustling waterfront with sea lions and seafood",
  },
  {
    id: "7",
    name: "Golden Gate Park",
    lat: 37.7694,
    lng: -122.4862,
    description: "Massive urban park with gardens and museums",
  },
  {
    id: "8",
    name: "Embarcadero",
    lat: 37.7993,
    lng: -122.3976,
    description: "Scenic waterfront promenade along the bay",
  },
  {
    id: "9",
    name: "Presidio",
    lat: 37.7989,
    lng: -122.4662,
    description: "Former military post turned national park",
  },
  {
    id: "10",
    name: "Ocean Beach",
    lat: 37.7604,
    lng: -122.5107,
    description: "Rugged Pacific beach on the western edge",
  },
];
