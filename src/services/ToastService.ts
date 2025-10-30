export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
  id?: string;
}

export interface Toast extends ToastOptions {
  id: string;
  timestamp: number;
}

type ToastCallback = (toasts: Toast[]) => void;

export class ToastService {
  private toasts: Toast[] = [];
  private callbacks: Set<ToastCallback> = new Set();
  private readonly DEFAULT_DURATION = 5000; // 5 seconds
  private idCounter = 0;

  /**
   * Show a success toast
   */
  success(message: string, duration?: number): string {
    return this.show({
      message,
      type: 'success',
      duration,
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, duration?: number): string {
    return this.show({
      message,
      type: 'error',
      duration,
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, duration?: number): string {
    return this.show({
      message,
      type: 'info',
      duration,
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration?: number): string {
    return this.show({
      message,
      type: 'warning',
      duration,
    });
  }

  /**
   * Show a toast notification
   */
  show(options: ToastOptions): string {
    const id = options.id || this.generateId();
    const duration = options.duration ?? this.DEFAULT_DURATION;

    const toast: Toast = {
      id,
      message: options.message,
      type: options.type,
      duration,
      timestamp: Date.now(),
    };

    this.toasts.push(toast);
    this.notifyCallbacks();

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   */
  dismiss(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    
    if (index !== -1) {
      this.toasts.splice(index, 1);
      this.notifyCallbacks();
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts = [];
    this.notifyCallbacks();
  }

  /**
   * Get all active toasts
   */
  getToasts(): Toast[] {
    return [...this.toasts];
  }

  /**
   * Subscribe to toast changes
   */
  subscribe(callback: ToastCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current toasts
    callback(this.getToasts());
    
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  private notifyCallbacks(): void {
    const toasts = this.getToasts();
    this.callbacks.forEach(callback => {
      try {
        callback(toasts);
      } catch (error) {
        console.error('Error in toast callback:', error);
      }
    });
  }

  /**
   * Generate unique toast ID
   */
  private generateId(): string {
    return `toast-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * Clear all toasts and callbacks
   */
  clear(): void {
    this.toasts = [];
    this.callbacks.clear();
  }

  /**
   * Get toast count
   */
  getCount(): number {
    return this.toasts.length;
  }

  /**
   * Check if there are any toasts
   */
  hasToasts(): boolean {
    return this.toasts.length > 0;
  }

  /**
   * Get toasts by type
   */
  getToastsByType(type: ToastType): Toast[] {
    return this.toasts.filter(toast => toast.type === type);
  }

  /**
   * Update a toast message
   */
  update(id: string, message: string): void {
    const toast = this.toasts.find(t => t.id === id);
    
    if (toast) {
      toast.message = message;
      this.notifyCallbacks();
    }
  }

  /**
   * Check if a toast exists
   */
  exists(id: string): boolean {
    return this.toasts.some(toast => toast.id === id);
  }
}

// Export singleton instance
export const toastService = new ToastService();
