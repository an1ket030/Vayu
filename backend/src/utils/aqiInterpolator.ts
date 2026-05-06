interface Point {
  lat: number;
  lon: number;
  value: number;
}

/**
 * Inverse Distance Weighting (IDW) interpolation
 */
export const interpolateAQI = (
  targetLat: number,
  targetLon: number,
  points: Point[],
  power = 2
): number => {
  if (points.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(targetLat - point.lat, 2) + Math.pow(targetLon - point.lon, 2)
    );

    if (distance === 0) return point.value;

    const weight = 1 / Math.pow(distance, power);
    weightedSum += weight * point.value;
    totalWeight += weight;
  }

  return weightedSum / totalWeight;
};
