# Cuentos Infantiles para Helena

Una aplicación web para escuchar cuentos infantiles, hecha con amor para que Helena los disfrute por las noches.

## ¿Qué es esto?

Reproductor de cuentos infantiles en formato FLAC con:

- Reproducción continua con paso automático al siguiente cuento
- Portadas extraídas de los metadatos del archivo de audio
- Sistema de calificación con estrellas por cuento
- **Media Session API** — controles de reproducción funcionan con la pantalla apagada (ideal para cuando ya está durmiendo)
- Panel de administración para gestionar la biblioteca
- Streaming de audio con soporte de HTTP range requests

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 + Tailwind CSS v4 |
| Backend | Express.js + Node.js |
| Base de datos | PostgreSQL |
| Audio | Archivos FLAC con metadatos embebidos |
| Deploy | Docker + Docker Compose |

## Estructura del proyecto

```
cuentos-infantiles/
├── api/            # Backend Express.js
│   └── src/
│       ├── routes/ # Endpoints REST
│       └── utils/  # Lectura de metadatos de audio
├── frontend/       # Angular 20
│   └── src/app/
│       ├── components/   # player, stars, story-card
│       ├── pages/        # home, admin
│       └── services/     # cuentos.service.ts
├── cuentos/        # Archivos FLAC (no incluidos en el repo)
└── docker-compose.yml
```

## Requisitos

- Docker y Docker Compose, **o**
- Node.js 18+ y PostgreSQL (para desarrollo local)

## Instalación con Docker

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/nesticle8bit/cuentos-infantiles.git
   cd cuentos-infantiles
   ```

2. Crear la carpeta `cuentos/` y copiar los archivos FLAC ahí.

3. Copiar el archivo de entorno del backend:
   ```bash
   cp api/.env.example api/.env
   # Editar api/.env con los datos de tu base de datos
   ```

4. Levantar todo con Docker Compose:
   ```bash
   docker compose up -d
   ```

5. Abrir http://localhost en el navegador.

6. Ir al panel de administración en http://localhost/admin y hacer clic en **"Escanear carpeta"** para importar los cuentos.

## Instalación para desarrollo local

### Backend

```bash
cd api
npm install
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
npm run dev
```

El backend queda en http://localhost:4000

### Frontend

```bash
cd frontend
npm install
npm start
```

El frontend queda en http://localhost:4200

## Variables de entorno

Crear `api/.env` basándose en este ejemplo:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/cuentos_infantiles_db
PORT=4000
CUENTOS_DIR=../cuentos
COVERS_DIR=./covers
```

## API endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cuentos` | Listar todos los cuentos |
| GET | `/api/cuentos/:id/audio` | Stream del archivo de audio |
| GET | `/api/cuentos/:id/cover` | Portada del cuento |
| POST | `/api/cuentos/scan` | Escanear carpeta e importar |
| PUT | `/api/cuentos/:id` | Actualizar datos (ej: rating) |
| GET | `/health` | Estado del servidor |

---

*Hecho con cariño para Helena.*
