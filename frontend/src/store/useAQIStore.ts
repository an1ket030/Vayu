import { create } from 'zustand';

interface AQIState {
  currentAQI: number | null;
  stationName: string | null;
  pollutants: any | null;
  stations: any[];
  setAQIData: (data: { aqi: number; name: string; pollutants?: any }) => void;
  setStations: (stations: any[]) => void;
}

export const useAQIStore = create<AQIState>((set) => ({
  currentAQI: null,
  stationName: null,
  pollutants: null,
  stations: [],
  setAQIData: (data) => set({
    currentAQI: data.aqi,
    stationName: data.name,
    pollutants: data.pollutants || null,
  }),
  setStations: (stations) => set({ stations }),
}));
