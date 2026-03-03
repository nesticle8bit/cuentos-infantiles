import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CuentosService } from '../../services/cuentos.service';
import { StoryCardComponent } from '../../components/story-card/story-card';
import { StarsComponent } from '../../components/stars/stars';
import { Cuento } from '../../models/cuento.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, StoryCardComponent, StarsComponent],
  template: `
    <div class="min-h-screen relative">
      <!-- Estrellas de fondo -->
      <app-stars />

      <!-- Header -->
      <header class="relative z-10 px-4 pt-8 pb-4">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-black text-white leading-tight" style="text-shadow: 0 0 30px rgba(244,114,182,0.5)">
              ✨ Cuentos para Helena
            </h1>
            <p class="text-purple-300 text-sm mt-1 font-semibold">
              {{ cuentos().length }} cuentos para soñar
            </p>
          </div>
          <a
            routerLink="/admin"
            class="glass rounded-2xl px-4 py-2 text-white/70 hover:text-white text-sm font-bold transition-all hover:bg-white/10 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Admin
          </a>
        </div>

        <!-- Buscador -->
        <div class="max-w-2xl mx-auto mt-4">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar cuento..."
              [value]="searchQuery()"
              (input)="onSearch($event)"
              class="w-full glass rounded-2xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-400/50"
            >
          </div>
        </div>
      </header>

      <!-- Estado de carga -->
      @if (loading()) {
        <div class="relative z-10 flex flex-col items-center justify-center py-24 gap-4">
          <div class="text-6xl animate-float">📖</div>
          <p class="text-white/60 font-bold animate-pulse">Cargando cuentos...</p>
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <div class="glass rounded-3xl p-6 text-center border border-red-500/30">
            <div class="text-5xl mb-3">😢</div>
            <p class="text-red-300 font-bold mb-2">No se pudieron cargar los cuentos</p>
            <p class="text-white/50 text-sm mb-4">{{ error() }}</p>
            <button
              (click)="loadCuentos()"
              class="px-6 py-2 rounded-full text-sm font-bold text-white"
              style="background: linear-gradient(135deg, #f472b6, #a78bfa)"
            >
              Reintentar
            </button>
          </div>
        </div>
      }

      <!-- Grid de cuentos -->
      @if (!loading() && !error()) {
        <main class="relative z-10 max-w-2xl mx-auto px-4 pb-40">
          @if (filteredCuentos().length === 0) {
            <div class="text-center py-20">
              <div class="text-6xl mb-4">🔍</div>
              <p class="text-white/60 font-bold">No encontramos ese cuento</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              @for (cuento of filteredCuentos(); track cuento.id) {
                <div class="animate-fade-in">
                  <app-story-card
                    [cuento]="cuento"
                    [isActive]="service.currentCuento()?.id === cuento.id"
                    (onPlay)="playCuento(cuento)"
                  />
                </div>
              }
            </div>
          }
        </main>
      }
    </div>
  `,
})
export class HomeComponent implements OnInit {
  cuentos = signal<Cuento[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');

  filteredCuentos = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.cuentos();
    return this.cuentos().filter(c =>
      c.titulo.toLowerCase().includes(q) ||
      (c.artista?.toLowerCase().includes(q) ?? false)
    );
  });

  constructor(public service: CuentosService) {}

  ngOnInit() {
    this.loadCuentos();
  }

  loadCuentos() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: (data) => {
        this.cuentos.set(data);
        this.service.playlist.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error de conexión con el servidor');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  playCuento(cuento: Cuento) {
    const idx = this.cuentos().findIndex(c => c.id === cuento.id);
    this.service.setPlaylist(this.cuentos(), idx >= 0 ? idx : 0);
  }
}
