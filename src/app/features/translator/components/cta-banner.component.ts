import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 p-8">
      <!-- Decorative grid pattern -->
      <div class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 24px 24px;">
      </div>

      <!-- Decorative globe shape -->
      <div class="absolute -left-8 bottom-0 opacity-20">
        <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
          <ellipse cx="100" cy="80" rx="90" ry="90" stroke="white" stroke-width="1.5" fill="none"/>
          <ellipse cx="100" cy="80" rx="45" ry="90" stroke="white" stroke-width="1.5" fill="none"/>
          <line x1="10" y1="80" x2="190" y2="80" stroke="white" stroke-width="1.5"/>
          <line x1="10" y1="50" x2="190" y2="50" stroke="white" stroke-width="1" opacity="0.6"/>
          <line x1="10" y1="110" x2="190" y2="110" stroke="white" stroke-width="1" opacity="0.6"/>
        </svg>
      </div>

      <div class="relative z-10 max-w-lg ml-auto text-right">
        <h2 class="text-2xl font-bold text-white mb-2">Unlock the Global Conversation</h2>
        <p class="text-blue-200 text-sm mb-6 leading-relaxed">
          LinguistAI uses proprietary multi-context understanding to not just translate,
          but truly understand &amp; root language patterns.
        </p>
        <app-button variant="white" size="lg">
          Explore Advanced Features
        </app-button>
      </div>
    </div>
  `,
})
export class CtaBannerComponent {}
