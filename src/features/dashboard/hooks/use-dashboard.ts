import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });
};

export const usePipelineActivity = () => {
  return useQuery({
    queryKey: ['dashboard-pipeline'],
    queryFn: dashboardService.getPipelineActivity,
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardService.getRecentActivity,
  });
};
