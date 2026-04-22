export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number; // total number of bicycle spaces
  occupied?: number; // current number of occupied spaces (optional, defaults to 0)
}

export const locations: Location[] = [
  {
    id: "1",
    name: "Soda Hall Rack",
    lat: 37.87558624752073,
    lng: -122.25878751504959,
    capacity: 8,
    occupied: 0,
  },
  {
    id: "2",
    name: "Jacobs Hall Rack",
    lat: 37.87606307089439,
    lng: -122.25876984955768,
    capacity: 4,
    occupied: 0,
  },
  {
    id: "3",
    name: "Etcheverry Hall Rack",
    lat: 37.87552185641807,
    lng: -122.25971037952607,
    capacity: 4,
    occupied: 0,
  },
  {
    id: "4",
    name: "Davis Hall Rack",
    lat: 37.874625560878165,
    lng: -122.25799777350028,
    capacity: 12,
    occupied: 0,
  },
];
