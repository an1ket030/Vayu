/**
 * Calculate AQI from concentration using EPA formula
 * Ip = [(Ihi-Ilo)/(BPhi-BPlo)] * (Cp-BPlo) + Ilo
 */
export const calculateAQI = (concentration: number, pollutant: 'pm25' | 'pm10') => {
  const breakpoints = {
    pm25: [
      { bp_lo: 0.0, bp_hi: 12.0, i_lo: 0, i_hi: 50 },
      { bp_lo: 12.1, bp_hi: 35.4, i_lo: 51, i_hi: 100 },
      { bp_lo: 35.5, bp_hi: 55.4, i_lo: 101, i_hi: 150 },
      { bp_lo: 55.5, bp_hi: 150.4, i_lo: 151, i_hi: 200 },
      { bp_lo: 150.5, bp_hi: 250.4, i_lo: 201, i_hi: 300 },
      { bp_lo: 250.5, bp_hi: 350.4, i_lo: 301, i_hi: 400 },
      { bp_lo: 350.5, bp_hi: 500.4, i_lo: 401, i_hi: 500 },
    ],
    pm10: [
      { bp_lo: 0, bp_hi: 54, i_lo: 0, i_hi: 50 },
      { bp_lo: 55, bp_hi: 154, i_lo: 51, i_hi: 100 },
      { bp_lo: 155, bp_hi: 254, i_lo: 101, i_hi: 150 },
      { bp_lo: 255, bp_hi: 354, i_lo: 151, i_hi: 200 },
      { bp_lo: 355, bp_hi: 424, i_lo: 201, i_hi: 300 },
      { bp_lo: 425, bp_hi: 504, i_lo: 301, i_hi: 400 },
      { bp_lo: 505, bp_hi: 604, i_lo: 401, i_hi: 500 },
    ],
  };

  const pollutantBPs = breakpoints[pollutant];
  const bp = pollutantBPs.find((b) => concentration >= b.bp_lo && concentration <= b.bp_hi);

  if (!bp) return 500;

  const aqi = ((bp.i_hi - bp.i_lo) / (bp.bp_hi - bp.bp_lo)) * (concentration - bp.bp_lo) + bp.i_lo;
  return Math.round(aqi);
};
