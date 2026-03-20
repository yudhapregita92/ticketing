/**
 * Utility for Haptic Feedback
 */
export const hapticFeedback = {
  /**
   * Light vibration for success or subtle interactions
   */
  light: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium vibration for important actions
   */
  medium: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy vibration for errors or critical warnings
   */
  heavy: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Double pulse for notifications
   */
  notification: () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  }
};
