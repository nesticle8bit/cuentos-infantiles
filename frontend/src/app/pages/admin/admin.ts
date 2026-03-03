import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CuentosService } from '../../services/cuentos.service';
import { StarsComponent } from '../../components/stars/stars';
import { Cuento } from '../../models/cuento.model';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, StarsComponent],
  template: `
    <div class="min-h-screen relative">
      <app-stars />

      <!-- Header -->
      <header class="relative z-10 px-4 pt-6 pb-4">
        <div class="max-w-4xl mx-auto flex items-center gap-4">
          <a
            routerLink="/"
            class="glass w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 class="text-2xl font-black text-white">Panel Admin</h1>
            <p class="text-purple-300 text-xs font-semibold">{{ cuentos().length }} cuentos registrados</p>
          </div>
          <div class="ml-auto flex gap-2">
            <button
              (click)="scanFolder()"
              [disabled]="scanning()"
              class="glass px-4 py-2 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4" [class.animate-spin]="scanning()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ scanning() ? 'Escaneando...' : 'Escanear carpeta' }}
            </button>
            <button
              (click)="openForm(null)"
              class="px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2"
              style="background: linear-gradient(135deg, #f472b6, #a78bfa)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Agregar
            </button>
          </div>
        </div>
      </header>

      <!-- Mensajes de estado -->
      @if (scanMsg()) {
        <div class="relative z-10 max-w-4xl mx-auto px-4 mb-4">
          <div class="glass rounded-2xl p-3 text-sm font-semibold"
               [class.text-green-300]="!scanError()"
               [class.text-red-300]="scanError()">
            {{ scanMsg() }}
          </div>
        </div>
      }

      <!-- Lista de cuentos -->
      <main class="relative z-10 max-w-4xl mx-auto px-4 pb-10">
        @if (loading()) {
          <div class="flex justify-center py-20">
            <div class="text-5xl animate-float">📖</div>
          </div>
        } @else {
          <div class="glass rounded-3xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left p-4 text-purple-300 font-bold w-14">Portada</th>
                  <th class="text-left p-4 text-purple-300 font-bold">Título</th>
                  <th class="text-left p-4 text-purple-300 font-bold hidden sm:table-cell">Duración</th>
                  <th class="text-left p-4 text-purple-300 font-bold hidden sm:table-cell">Reproducido</th>
                  <th class="text-right p-4 text-purple-300 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (cuento of cuentos(); track cuento.id) {
                  <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <!-- Portada -->
                    <td class="p-3">
                      <div class="w-10 h-10 rounded-xl overflow-hidden bg-purple-900/50 flex-shrink-0">
                        @if (cuento.tiene_portada) {
                          <img [src]="service.getCoverUrl(cuento.id)" [alt]="cuento.titulo" class="w-full h-full object-cover">
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-lg">📖</div>
                        }
                      </div>
                    </td>
                    <!-- Título -->
                    <td class="p-3">
                      <p class="font-bold text-white line-clamp-1">{{ cuento.titulo }}</p>
                      @if (cuento.artista) {
                        <p class="text-purple-300 text-xs">{{ cuento.artista }}</p>
                      }
                    </td>
                    <!-- Duración -->
                    <td class="p-3 text-white/60 hidden sm:table-cell">
                      {{ service.formatDuration(cuento.duracion) }}
                    </td>
                    <!-- Veces reproducido -->
                    <td class="p-3 hidden sm:table-cell">
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                        <span class="text-white font-bold">{{ cuento.veces_reproducido }}</span>
                      </div>
                    </td>
                    <!-- Acciones -->
                    <td class="p-3">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="openForm(cuento)"
                          class="w-8 h-8 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 flex items-center justify-center transition-all"
                          title="Editar"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button
                          (click)="confirmDelete(cuento)"
                          class="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 flex items-center justify-center transition-all"
                          title="Eliminar"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            @if (cuentos().length === 0) {
              <div class="text-center py-16 text-white/40">
                <div class="text-5xl mb-3">📭</div>
                <p class="font-bold">No hay cuentos registrados</p>
                <p class="text-sm mt-1">Usa "Escanear carpeta" para importar los archivos</p>
              </div>
            }
          </div>
        }
      </main>
    </div>

    <!-- Modal de edición/creación -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
           style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
           (click)="closeForm()">
        <div class="w-full max-w-md glass rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
             (click)="$event.stopPropagation()">
          <h2 class="text-xl font-black text-white mb-6">
            {{ editingCuento() ? 'Editar Cuento' : 'Nuevo Cuento' }}
          </h2>

          <form (ngSubmit)="saveForm()" #adminForm>
            <!-- Portada preview -->
            <div class="flex justify-center mb-5">
              <div class="relative w-28 h-28 rounded-2xl overflow-hidden bg-purple-900/50 cursor-pointer group"
                   (click)="coverInput.click()">
                @if (previewUrl()) {
                  <img [src]="previewUrl()!" class="w-full h-full object-cover">
                } @else if (editingCuento()?.tiene_portada) {
                  <img [src]="service.getCoverUrl(editingCuento()!.id)" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-5xl">📖</div>
                }
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
              </div>
              <input #coverInput type="file" accept="image/*" class="hidden" (change)="onCoverSelected($event)">
            </div>

            <!-- Título -->
            <div class="mb-4">
              <label class="block text-purple-300 text-xs font-bold uppercase tracking-wide mb-2">Título *</label>
              <input
                type="text"
                [(ngModel)]="form.titulo"
                name="titulo"
                required
                placeholder="Nombre del cuento"
                class="w-full glass rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-400/50"
              >
            </div>

            <!-- Artista -->
            <div class="mb-4">
              <label class="block text-purple-300 text-xs font-bold uppercase tracking-wide mb-2">Narrador / Artista</label>
              <input
                type="text"
                [(ngModel)]="form.artista"
                name="artista"
                placeholder="Narrador del cuento"
                class="w-full glass rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-400/50"
              >
            </div>

            <!-- Album -->
            <div class="mb-4">
              <label class="block text-purple-300 text-xs font-bold uppercase tracking-wide mb-2">Colección / Álbum</label>
              <input
                type="text"
                [(ngModel)]="form.album"
                name="album"
                placeholder="Colección de cuentos"
                class="w-full glass rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-400/50"
              >
            </div>

            <!-- Descripción -->
            <div class="mb-5">
              <label class="block text-purple-300 text-xs font-bold uppercase tracking-wide mb-2">Descripción</label>
              <textarea
                [(ngModel)]="form.descripcion"
                name="descripcion"
                rows="3"
                placeholder="Breve descripción del cuento..."
                class="w-full glass rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-400/50 resize-none"
              ></textarea>
            </div>

            @if (formError()) {
              <p class="text-red-400 text-sm mb-4 font-semibold">{{ formError() }}</p>
            }

            <!-- Botones -->
            <div class="flex gap-3">
              <button
                type="button"
                (click)="closeForm()"
                class="flex-1 glass py-3 rounded-2xl text-white/70 font-bold text-sm hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50"
                style="background: linear-gradient(135deg, #f472b6, #a78bfa)"
              >
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal de confirmación de eliminación -->
    @if (deletingCuento()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)">
        <div class="w-full max-w-sm glass rounded-3xl p-6 animate-fade-in">
          <div class="text-center mb-5">
            <div class="text-5xl mb-3">🗑️</div>
            <h3 class="text-lg font-black text-white mb-2">¿Eliminar cuento?</h3>
            <p class="text-white/60 text-sm">
              "{{ deletingCuento()!.titulo }}" será eliminado permanentemente de la base de datos.
            </p>
          </div>
          <div class="flex gap-3">
            <button
              (click)="deletingCuento.set(null)"
              class="flex-1 glass py-3 rounded-2xl text-white/70 font-bold text-sm hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              (click)="deleteCuento()"
              [disabled]="deleting()"
              class="flex-1 py-3 rounded-2xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {{ deleting() ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminComponent implements OnInit {
  cuentos = signal<Cuento[]>([]);
  loading = signal(true);
  scanning = signal(false);
  scanMsg = signal<string | null>(null);
  scanError = signal(false);

  showForm = signal(false);
  editingCuento = signal<Cuento | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  selectedCoverFile: File | null = null;

  deletingCuento = signal<Cuento | null>(null);
  deleting = signal(false);

  form = {
    titulo: '',
    artista: '',
    album: '',
    descripcion: '',
  };

  constructor(public service: CuentosService) {}

  ngOnInit() {
    this.loadCuentos();
  }

  loadCuentos() {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.cuentos.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  scanFolder() {
    this.scanning.set(true);
    this.scanMsg.set(null);
    this.service.scan().subscribe({
      next: (res) => {
        this.scanMsg.set(res.mensaje);
        this.scanError.set(false);
        this.scanning.set(false);
        this.loadCuentos();
        setTimeout(() => this.scanMsg.set(null), 5000);
      },
      error: (err) => {
        this.scanMsg.set(err.error?.error || 'Error al escanear la carpeta');
        this.scanError.set(true);
        this.scanning.set(false);
      },
    });
  }

  openForm(cuento: Cuento | null) {
    this.editingCuento.set(cuento);
    this.previewUrl.set(null);
    this.selectedCoverFile = null;
    this.formError.set(null);
    this.form = {
      titulo: cuento?.titulo ?? '',
      artista: cuento?.artista ?? '',
      album: cuento?.album ?? '',
      descripcion: cuento?.descripcion ?? '',
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingCuento.set(null);
  }

  onCoverSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedCoverFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  saveForm() {
    if (!this.form.titulo.trim()) {
      this.formError.set('El título es requerido');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', this.form.titulo.trim());
    if (this.form.artista) formData.append('artista', this.form.artista.trim());
    if (this.form.album) formData.append('album', this.form.album.trim());
    if (this.form.descripcion) formData.append('descripcion', this.form.descripcion.trim());
    if (this.selectedCoverFile) formData.append('portada', this.selectedCoverFile);

    this.saving.set(true);
    this.formError.set(null);

    const cuento = this.editingCuento();
    const op$ = cuento
      ? this.service.update(cuento.id, formData)
      : this.service.create(formData);

    op$.subscribe({
      next: () => {
        this.closeForm();
        this.saving.set(false);
        this.loadCuentos();
      },
      error: (err) => {
        this.formError.set(err.error?.error || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(cuento: Cuento) {
    this.deletingCuento.set(cuento);
  }

  deleteCuento() {
    const cuento = this.deletingCuento();
    if (!cuento) return;
    this.deleting.set(true);
    this.service.delete(cuento.id).subscribe({
      next: () => {
        this.cuentos.update(list => list.filter(c => c.id !== cuento.id));
        this.deletingCuento.set(null);
        this.deleting.set(false);
      },
      error: () => this.deleting.set(false),
    });
  }
}
