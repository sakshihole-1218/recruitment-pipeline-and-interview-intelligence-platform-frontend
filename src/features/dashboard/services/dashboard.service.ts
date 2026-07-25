import { apiClient as api } from '@/lib/api-client';
import { ApiSuccessResponse } from '@/types/api.types';

export interface DashboardStats {
  jobOpenings: number;
  candidates: number;
  applications: number;
  interviews: number;
  offers: number;
}

export interface PipelineActivity {
  stage: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  action_type: string;
  entity_type: string;
  created_at: string;
  action_by_user?: {
    first_name: string;
    last_name: string;
  };
  // other fields...
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiSuccessResponse<DashboardStats>>('/dashboard/stats');
    return data.data;
  },

  getPipelineActivity: async (): Promise<PipelineActivity[]> => {
    const { data } = await api.get<ApiSuccessResponse<PipelineActivity[]>>('/dashboard/pipeline');
    return data.data;
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const { data } = await api.get<ApiSuccessResponse<RecentActivity[]>>('/dashboard/activity');
    return data.data;
  },
};
