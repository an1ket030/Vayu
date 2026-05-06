/**
 * WHO safe limit = AQI 25 (PM2.5 annual mean: 5 µg/m³, 24h mean: 15 µg/m³)
 * Daily exposure score formula:
 * total_weighted_minutes = Σ (aqi_i × duration_minutes_i)
 * safe_limit_minutes = 25 × total_minutes_tracked
 * exposure_multiplier = total_weighted_minutes / safe_limit_minutes
 */
export const calculateExposureMultiplier = (logs: { aqi: number; durationSec: number }[]) => {
  if (logs.length === 0) return 0;

  const totalWeightedMinutes = logs.reduce((acc, log) => {
    const durationMinutes = log.durationSec / 60;
    return acc + (log.aqi * durationMinutes);
  }, 0);

  const totalMinutesTracked = logs.reduce((acc, log) => acc + (log.durationSec / 60), 0);
  const safeLimitMinutes = 25 * totalMinutesTracked;

  if (safeLimitMinutes === 0) return 0;

  return totalWeightedMinutes / safeLimitMinutes;
};

export const getExposureCategory = (multiplier: number) => {
  if (multiplier < 1) return { label: "Within safe limits", color: "green" };
  if (multiplier < 3) return { label: "Moderate exposure", color: "yellow" };
  if (multiplier < 7) return { label: "High exposure", color: "orange" };
  if (multiplier < 15) return { label: "Very high exposure", color: "red" };
  return { label: "Hazardous exposure", color: "black" };
};
