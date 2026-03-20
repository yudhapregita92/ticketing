import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ITicket, IAppSettings, IUser, IDepartment, ICategory, IMasterUser } from '../types';
import { toast } from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';

export const useTickets = (username?: string, role?: string) => {
  return useQuery<ITicket[]>({
    queryKey: ['tickets', username, role],
    queryFn: () => api.getTickets(username, role),
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

export const useTicketDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['ticketDetails', id],
    queryFn: () => api.getTicketDetails(id!),
    enabled: !!id,
  });
};

export const useSettings = () => {
  return useQuery<IAppSettings>({
    queryKey: ['settings'],
    queryFn: () => api.getSettings() as any,
  });
};

export const useManagementData = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['managementData'],
    queryFn: async () => {
      const [it, depts, cats, users, masters, admins] = await Promise.all([
        api.getITPersonnel(),
        api.getDepartments(),
        api.getCategories(),
        api.getUsers(),
        api.getMasterUsers(),
        api.getAdminUsers()
      ]);
      return { it, depts, cats, users, masters, admins };
    },
    enabled: isAdmin,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: any) => api.createTicket(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Tiket berhasil dikirim!');
      hapticFeedback.medium();
    },
    onError: (error: any) => {
      toast.error(`Gagal mengirim tiket: ${error.message}`);
      hapticFeedback.heavy();
    }
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.updateTicket(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', variables.id] });
      toast.success('Tiket berhasil diperbarui');
      hapticFeedback.light();
    },
    onError: (error: any) => {
      toast.error(`Gagal memperbarui tiket: ${error.message}`);
      hapticFeedback.heavy();
    }
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Tiket berhasil dihapus');
      hapticFeedback.medium();
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus tiket: ${error.message}`);
      hapticFeedback.heavy();
    }
  });
};
