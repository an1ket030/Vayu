import { create } from 'zustand';

interface ExposureState {
  dailyExposure: number;
  logs: any[];
  setLogs: (logs: any[]) => void;
  addLog: (log: any) => void;
  calculateDailyExposure: () => void;
}

export const useExposureStore = create<ExposureState>((set, get) => ({
  dailyExposure: 0,
  logs: [],
  setLogs: (logs) => set({ logs }),
  addLog: (log) => {
    const newLogs = [log, ...get().logs];
    set({ logs: newLogs });
    get().calculateDailyExposure();
  },
  calculateDailyExposure: () => {
    const logs = get().logs;
    // WHO safe limit logic
    const totalWeightedMinutes = logs.reduce((acc, log) => acc + (log.aqi * (log.durationSec / 60)), 0);
    const totalMinutes = logs.reduce((acc, log) => acc + (log.durationSec / 60), 0);
    const safeLimitMinutes = 25 * totalMinutes;
    const exposure = safeLimitMinutes > 0 ? totalWeightedMinutes / safeLimitMinutes : 0;
    set({ dailyExposure: exposure });
  },
}));
