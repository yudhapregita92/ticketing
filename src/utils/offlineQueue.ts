import { hapticFeedback } from './haptics';
import { toast } from 'react-hot-toast';

const OFFLINE_QUEUE_KEY = 'it_helpdesk_offline_queue';

export interface OfflineTicket {
  id: string;
  formData: any;
  timestamp: number;
}

export const offlineQueue = {
  /**
   * Get all tickets in the offline queue
   */
  getQueue: (): OfflineTicket[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Add a ticket to the offline queue
   */
  add: (formData: any) => {
    const queue = offlineQueue.getQueue();
    const newTicket: OfflineTicket = {
      id: Math.random().toString(36).substring(2, 9),
      formData,
      timestamp: Date.now()
    };
    queue.push(newTicket);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    hapticFeedback.medium();
    return newTicket;
  },

  /**
   * Remove a ticket from the queue by its temporary ID
   */
  remove: (id: string) => {
    const queue = offlineQueue.getQueue();
    const filtered = queue.filter(t => t.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  },

  /**
   * Clear the entire queue
   */
  clear: () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  /**
   * Check if the queue is empty
   */
  isEmpty: () => {
    return offlineQueue.getQueue().length === 0;
  }
};
