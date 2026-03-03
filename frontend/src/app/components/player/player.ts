import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  signal,
  computed,
} from '@angular/core';
import { CuentosService } from '../../services/cuentos.service';

@Component({
  selector: 'app-player',
  imports: [],
  template: `
    @if (service.currentCuento()) {
      <div class="fixed bottom-0 left-0 right-0 z-50 animate-slide-up glass-dark px-4 pt-3 pb-safe">
        <!-- Barra de progreso (arriba del player) -->
        <div class="relative w-full mb-3 group">
          <input
            #progressBar
            type="range"
            [min]="0"
            [max]="duration()"
            [value]="currentTime()"
            (input)="onSeek($event)"
            class="w-full h-1 cursor-pointer"
          />
          <div class="flex justify-between text-xs text-white/50 mt-1 px-0.5">
            <span>{{ formatTime(currentTime()) }}</span>
            <span>{{ formatTime(duration()) }}</span>
          </div>
        </div>

        <!-- Contenido principal del player -->
        <div class="flex items-center gap-3 pb-3">
          <!-- Portada pequeña -->
          <div class="relative flex-shrink-0">
            <div
              class="w-14 h-14 rounded-2xl overflow-hidden shadow-lg"
              [class.animate-pulse-glow]="service.isPlaying()"
            >
              @if (service.currentCuento()!.tiene_portada) {
                <img
                  [src]="service.getCoverUrl(service.currentCuento()!.id)"
                  [alt]="service.currentCuento()!.titulo"
                  class="w-full h-full object-cover"
                  [class.animate-spin-slow]="service.isPlaying()"
                  (error)="imgError = true"
                />
              }
              @if (!service.currentCuento()!.tiene_portada || imgError) {
                <div
                  class="w-full h-full bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center"
                >
                  <span class="text-2xl">📖</span>
                </div>
              }
            </div>
          </div>

          <!-- Título y artista -->
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm text-white truncate leading-tight">
              {{ service.currentCuento()!.titulo }}
            </p>
            @if (service.currentCuento()!.artista) {
              <p class="text-xs text-purple-300 truncate mt-0.5">
                {{ service.currentCuento()!.artista }}
              </p>
            }
            <!-- Indicador de veces reproducido -->
            <p class="text-xs text-white/40 mt-0.5">
              {{ service.currentCuento()!.veces_reproducido }} reproducciones
            </p>
          </div>

          <!-- Controles -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Anterior -->
            <button
              (click)="playPrev()"
              class="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            <!-- Play/Pause -->
            <button
              (click)="togglePlay()"
              class="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
              style="width: 52px; height: 52px; background: linear-gradient(135deg, #f472b6, #a78bfa)"
            >
              @if (!service.isPlaying()) {
                <svg class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              } @else {
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              }
            </button>

            <!-- Siguiente -->
            <button
              (click)="playNext()"
              class="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Audio element oculto -->
    <audio
      #audioEl
      (timeupdate)="onTimeUpdate()"
      (loadedmetadata)="onLoadedMetadata()"
      (ended)="onEnded()"
      (play)="service.isPlaying.set(true)"
      (pause)="service.isPlaying.set(false)"
      (error)="onAudioError()"
      preload="metadata"
    ></audio>
  `,
})
export class PlayerComponent implements OnInit, OnDestroy {
  @ViewChild('audioEl') audioEl!: ElementRef<HTMLAudioElement>;

  currentTime = signal(0);
  duration = signal(0);
  imgError = false;

  private playRegistered = false;
  private loadedCuentoId: number | null = null;

  constructor(public service: CuentosService) {
    // Reaccionar solo cuando cambia el ID del cuento, no otras propiedades como veces_reproducido
    effect(() => {
      const cuento = this.service.currentCuento();
      const id = cuento?.id ?? null;
      if (id !== null && id !== this.loadedCuentoId && this.audioEl) {
        this.loadedCuentoId = id;
        this.loadCuento(id);
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.audioEl?.nativeElement) {
      this.audioEl.nativeElement.pause();
    }
  }

  private loadCuento(id: number) {
    const audio = this.audioEl.nativeElement;
    const cuento = this.service.currentCuento()!;

    this.imgError = false;
    this.playRegistered = false;
    audio.src = this.service.getAudioUrl(id);
    audio.load();
    audio.play().catch(console.error);

    this.setupMediaSession(cuento);
  }

  private setupMediaSession(cuento: any) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: cuento.titulo,
      artist: cuento.artista || 'Cuentos para Helena',
      album: cuento.album || 'Cuentos Infantiles',
      artwork: cuento.tiene_portada
        ? [{ src: this.service.getCoverUrl(cuento.id), sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', () => this.audioEl.nativeElement.play());
    navigator.mediaSession.setActionHandler('pause', () => this.audioEl.nativeElement.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
    navigator.mediaSession.setActionHandler('seekbackward', (d) => {
      this.audioEl.nativeElement.currentTime -= d.seekOffset ?? 10;
    });
    navigator.mediaSession.setActionHandler('seekforward', (d) => {
      this.audioEl.nativeElement.currentTime += d.seekOffset ?? 10;
    });
  }

  togglePlay() {
    const audio = this.audioEl.nativeElement;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }

  playNext() {
    const playlist = this.service.playlist();
    const idx = this.service.currentIndex();
    const nextIdx = (idx + 1) % playlist.length;
    this.service.currentIndex.set(nextIdx);
    this.service.currentCuento.set(playlist[nextIdx]);
  }

  playPrev() {
    const audio = this.audioEl.nativeElement;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const playlist = this.service.playlist();
    const idx = this.service.currentIndex();
    const prevIdx = (idx - 1 + playlist.length) % playlist.length;
    this.service.currentIndex.set(prevIdx);
    this.service.currentCuento.set(playlist[prevIdx]);
  }

  onSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioEl.nativeElement.currentTime = +input.value;
    this.currentTime.set(+input.value);
  }

  onTimeUpdate() {
    const audio = this.audioEl.nativeElement;
    this.currentTime.set(audio.currentTime);

    // Registrar reproducción al 5% del audio
    if (!this.playRegistered && audio.duration > 0 && audio.currentTime / audio.duration > 0.05) {
      this.playRegistered = true;
      const cuento = this.service.currentCuento();
      if (cuento) {
        this.service.registerPlay(cuento.id).subscribe((res) => {
          this.service.currentCuento.update((c) =>
            c ? { ...c, veces_reproducido: res.veces_reproducido } : c,
          );
          // Actualizar en la playlist también
          this.service.playlist.update((list) =>
            list.map((c) =>
              c.id === cuento.id ? { ...c, veces_reproducido: res.veces_reproducido } : c,
            ),
          );
        });
      }
    }

    // Actualizar media session position state
    if ('mediaSession' in navigator && audio.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch {}
    }
  }

  onLoadedMetadata() {
    this.duration.set(this.audioEl.nativeElement.duration);
  }

  onEnded() {
    this.playNext();
  }

  onAudioError() {
    console.error('Error al cargar el audio');
    this.service.isPlaying.set(false);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getCoverUrl(id: number): string {
    return this.service.getCoverUrl(id);
  }
}
