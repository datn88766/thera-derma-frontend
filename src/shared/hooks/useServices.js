import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/entities';

export function useServices(limit = 50) {
  return useQuery({
    queryKey: ['services', limit],
    queryFn: () => base44.entities.Service.list('-created_date', limit),
    staleTime: 60_000,
  });
}

export function useTreatments(limit = 50) {
  return useQuery({
    queryKey: ['treatments', limit],
    queryFn: () => base44.entities.Treatment.list('-created_date', limit),
    staleTime: 60_000,
  });
}

export function useFooterSettings() {
  return useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => base44.entities.FooterSettings.list().then((items) => items[0] ?? null),
    staleTime: 60_000,
    refetchOnMount: 'always',
    retry: 2,
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => base44.entities.BlogPost.categories(),
    staleTime: 120_000,
  });
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-admin-stats'],
    queryFn: () => base44.entities.Dashboard.adminStats(),
    staleTime: 30_000,
  });
}
