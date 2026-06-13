import { Injectable, signal } from '@angular/core';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface DialogState {
  visible: boolean;
  config: DialogConfig;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly state = signal<DialogState | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  openConfirm(config: DialogConfig): Promise<boolean> {
    this.close();
    this.state.set({ visible: true, config });
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(value: boolean): void {
    this.resolver?.(value);
    this.resolver = null;
    this.close();
  }

  private close(): void {
    this.state.set(null);
  }
}
