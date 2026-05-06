import { useQuery } from '@tanstack/react-query';
import { waqiService } from '../services/api.service';

export const useAQI = (city?: string) => {
  return useQuery({
    queryKey: ['aqi', city],
    queryFn: () => waqiService.getFeed(city!),
    // Only fetch when city is a non-empty string
    enabled: typeof city === 'string' && city.trim().length > 0,
    staleTime: 10 * 60 * 1000,    // 10 min — don't refetch if fresh
    refetchInterval: 15 * 60 * 1000, // 15 min background refresh
    retry: 2,
  });
};
