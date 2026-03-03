import { Component, input, output } from '@angular/core';
import { Cuento } from '../../models/cuento.model';
import { CuentosService } from '../../services/cuentos.service';

@Component({
  selector: 'app-story-card',
  imports: [],
  template: `
    <div
      class="relative rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:-translate-y-2"
      [class.ring-4]="isActive()"
      [class.ring-pink-400]="isActive()"
      [class.animate-pulse-glow]="isActive()"
      (click)="onPlay.emit(cuento())"
    >
      <!-- Portada -->
      <div class="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-900">
        @if (cuento().tiene_portada) {
          <img
            [src]="service.getCoverUrl(cuento().id)"
            [alt]="cuento().titulo"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            (error)="imgError = true"
          >
        }
        @if (!cuento().tiene_portada || imgError) {
          <div class="w-full h-full flex items-center justify-center">
            <span class="text-7xl select-none">📖</span>
          </div>
        }

        <!-- Overlay al hacer hover -->
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-pink-500/90 flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        <!-- Badge de reproduciendo -->
        @if (isActive()) {
          <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-pink-500 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
            <span class="flex gap-0.5">
              <span class="w-0.5 h-3 bg-white rounded animate-bounce" style="animation-delay:0s"></span>
              <span class="w-0.5 h-3 bg-white rounded animate-bounce" style="animation-delay:0.1s"></span>
              <span class="w-0.5 h-3 bg-white rounded animate-bounce" style="animation-delay:0.2s"></span>
            </span>
            Reproduciendo
          </div>
        }

        <!-- Badge veces reproducido -->
        @if (cuento().veces_reproducido > 0) {
          <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 text-xs font-bold">
            <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <span class="text-white">{{ cuento().veces_reproducido }}</span>
          </div>
        }
      </div>

      <!-- Info -->
      <div class="p-3 glass">
        <h3 class="font-bold text-sm leading-tight text-white line-clamp-2 mb-1">
          {{ cuento().titulo }}
        </h3>
        <div class="flex items-center justify-between text-xs text-white/50">
          <span>{{ service.formatDuration(cuento().duracion) }}</span>
          @if (cuento().artista) {
            <span class="truncate ml-2 text-purple-300">{{ cuento().artista }}</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class StoryCardComponent {
  cuento = input.required<Cuento>();
  isActive = input<boolean>(false);
  onPlay = output<Cuento>();

  imgError = false;

  constructor(public service: CuentosService) {}
}
