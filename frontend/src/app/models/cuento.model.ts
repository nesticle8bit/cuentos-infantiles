export interface Cuento {
  id: number;
  titulo: string;
  archivo: string;
  duracion: number;
  veces_reproducido: number;
  artista: string | null;
  album: string | null;
  descripcion: string | null;
  activo: boolean;
  tiene_portada: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScanResult {
  mensaje: string;
  importados: { id: number; titulo: string; archivo: string }[];
  omitidos: string[];
}
