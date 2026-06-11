import { Component, computed, input, output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [class]="classes()"
      (click)="clicked.emit()">
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly active = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly iconOnly = input<boolean>(false);
  readonly pill = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly clicked = output<void>();

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const rounded = this.pill() ? 'rounded-full' : 'rounded-lg';

    const sizeMap: Record<ButtonSize, string> = {
      sm: this.iconOnly() ? 'p-1.5' : 'px-3 py-1.5 text-xs',
      md: this.iconOnly() ? 'p-2' : 'px-4 py-2 text-sm',
      lg: this.iconOnly() ? 'p-2.5' : 'px-6 py-3 text-base',
    };

    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
      outline: this.active()
        ? 'border border-blue-600 bg-blue-50 text-blue-600'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      success: 'bg-green-100 text-green-700 hover:bg-green-200',
      danger: 'bg-red-100 text-red-700 hover:bg-red-200',
      white: 'bg-white text-blue-700 hover:bg-blue-50',
    };

    return [base, rounded, sizeMap[this.size()], variantMap[this.variant()]].join(' ');
  });
}
