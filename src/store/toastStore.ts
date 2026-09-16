import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastState {
  currentToast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  currentToast: null,
  showToast: (toast) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({
      currentToast: {
        ...toast,
        id,
        durationMs: toast.durationMs ?? 2600,
      },
    });
  },
  hideToast: () => set({ currentToast: null }),
}));

// Quick convenience helper functions
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().showToast({ type: 'success', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().showToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().showToast({ type: 'warning', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().showToast({ type: 'error', title, message }),
};
