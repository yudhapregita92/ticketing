import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ITicket, IAppSettings, IUser, IDepartment, ICategory, IMasterUser } from '../types';
import { toast } from 'react-hot-toast';
import { hapticFeedback } from '../utils/haptics';
import { offlineQueue } from '../utils/offlineQueue';
import { useState, useEffect } from 'react';

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
    mutationFn: async (formData: any) => {
      // Check if online
      if (!navigator.onLine) {
        offlineQueue.add(formData);
        throw new Error('OFFLINE_SAVED');
      }
      
      try {
        return await api.createTicket(formData);
      } catch (error) {
        // If network error, save to offline queue
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          offlineQueue.add(formData);
          throw new Error('OFFLINE_SAVED');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Tiket berhasil dikirim!');
      hapticFeedback.medium();
    },
    onError: (error: any) => {
      if (error.message === 'OFFLINE_SAVED') {
        toast.success('Koneksi terputus. Tiket disimpan di antrian offline dan akan dikirim otomatis saat online.');
        hapticFeedback.medium();
        return;
      }
      toast.error(`Gagal mengirim tiket: ${error.message}`);
      hapticFeedback.heavy();
    }
  });
};

export const useSyncOffline = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const sync = async () => {
    const queue = offlineQueue.getQueue();
    if (queue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    toast.loading(`Sinkronisasi ${queue.length} tiket offline...`, { id: 'sync-toast' });

    for (const item of queue) {
      try {
        await api.createTicket(item.formData);
        offlineQueue.remove(item.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync offline ticket:', error);
        failCount++;
      }
    }

    setIsSyncing(false);
    setPendingCount(offlineQueue.getQueue().length);
    
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(`${successCount} tiket offline berhasil dikirim!`, { id: 'sync-toast' });
      hapticFeedback.notification();
    } else if (failCount > 0) {
      toast.error('Gagal mensinkronisasi beberapa tiket offline.', { id: 'sync-toast' });
    } else {
      toast.dismiss('sync-toast');
    }
  };

  useEffect(() => {
    setPendingCount(offlineQueue.getQueue().length);

    const handleOnline = () => {
      sync();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial sync check
    if (navigator.onLine) {
      sync();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return { sync, isSyncing, pendingCount };
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
