import { create } from 'zustand';

interface RouteState {
  routes: any[];
  selectedRouteIndex: number;
  origin: [number, number] | null;
  destination: [number, number] | null;
  setRoutes: (routes: any[]) => void;
  setSelectedRouteIndex: (index: number) => void;
  setPoints: (origin: [number, number] | null, destination: [number, number] | null) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  routes: [],
  selectedRouteIndex: 0,
  origin: null,
  destination: null,
  setRoutes: (routes) => set({ routes }),
  setSelectedRouteIndex: (index) => set({ selectedRouteIndex: index }),
  setPoints: (origin, destination) => set({ origin, destination }),
}));
