import { create } from 'zustand';

/**
 * UI store — transient interface state. Currently drives the toast
 * notification queue.
 */

let nextId = 1;

export const useUiStore = create((set, get) => ({
  toasts: [],

  /**
   * Push a toast. `type` is one of 'success' | 'error' | 'info'.
   * Auto-dismisses after `duration` ms.
   */
  toast: ({ title, message, type = 'info', duration = 4000 }) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration);
    }
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Convenience helpers so components can do `notify.success('Saved')`
 * without reaching into the store directly.
 */
export const notify = {
  success: (message, title) =>
    useUiStore.getState().toast({ type: 'success', message, title }),
  error: (message, title) =>
    useUiStore.getState().toast({ type: 'error', message, title }),
  info: (message, title) =>
    useUiStore.getState().toast({ type: 'info', message, title }),
};
