# Proyecto MusicParty — Estado actual (24/03/2026)

## Estructura general
- **backend/** (NestJS, TypeScript, Prisma)
- **frontend/** (React, Vite, TypeScript)

---

## Backend (NestJS)
- Framework: NestJS (TypeScript)
- ORM: Prisma
- Autenticación: JWT, Passport
- Estructura de módulos: auth, events, songs, votes, prisma
- Scripts principales:
  - `npm run start:dev` — Desarrollo
  - `npm run seed` — Seed de base de datos
  - `npm run test` — Tests unitarios
- Dependencias destacadas: @nestjs/*, @prisma/client, bcrypt, passport, passport-jwt
- DevDependencies: eslint, prettier, jest, types

---

## Frontend (React + Vite)
- Framework: React 18 + Vite
- Lenguaje: TypeScript
- Librerías principales: axios, react-router-dom, framer-motion, qrcode.react, lucide-react, uuid
- Estructura de carpetas: src/components, src/pages, src/hooks, src/api
- Scripts principales:
  - `npm run dev` — Desarrollo (Vite)
  - `npm run build` — Build de producción
  - `npm run lint` — Linter
- DevDependencies: eslint, typescript, @vitejs/plugin-react

---

## Paleta de colores utilizada

- **Fondo principal:** #0f172a
- **Fondo tarjetas:** #1e293b
- **Primario:** #8b5cf6
- **Primario hover:** #7c3aed
- **Secundario:** #334155
- **Texto principal:** #f8fafc
- **Texto secundario/muted:** #94a3b8
- **Acento:** #ec4899
- **Éxito:** #10b981
- **Vidrio (glass):** rgba(30, 41, 59, 0.7)
- **Bordes vidrio:** rgba(255, 255, 255, 0.1)

Estos colores se definen en `src/index.css` y se usan en toda la web, tanto en variables CSS como en componentes y estilos inline.

---

## App Móvil (Flutter)
- Framework: Flutter
- Lenguaje: Dart
- Puntos de entrada principales: `lib/main.dart`
- Rutas de prueba para web: `http://localhost:8080/`
- Scripts principales:
  - `flutter run` — Desarrollo (Emulador o Dispositivo)
  - `flutter run -d web-server --web-port=8080 --web-hostname=0.0.0.0` — Ejecución como servidor web para pruebas y túneles.

---

## Instrucciones Automáticas de Ejecución y Túneles (Ngrok / Localtunnel)

Para levantar el entorno completo y poder mostrárselo a clientes o pruebas externas, seguir este orden en terminales separadas:

### 1. Iniciar el Backend (Central)
```bash
cd backend
npm run start:dev
```
*Se ejecuta en `http://localhost:3000`*

### 2. Iniciar el Frontend (Usuarios, DJ y Admin)
```bash
cd frontend
npm run dev
```
*Se ejecuta localmente en `http://localhost:5177/`*
*Panel de Admin en `http://localhost:5177/admin`*

Para exponerlo externamente (ngrok):
```bash
ngrok http 5177
```

### 3. Iniciar la App Móvil (Como Web)
```bash
cd mobile
flutter run -d web-server --web-port=8080 --web-hostname=0.0.0.0
```
*Se ejecuta localmente en `http://localhost:8080/`*

Para exponerla externamente (localtunnel):
*(Dado que ngrok gratuito admite 1 solo túnel simultáneo)*
```bash
npx localtunnel --port 8080
```

---

### Última actualización: 12/04/2026

Este documento resume el estado actual del proyecto MusicParty, incluyendo tecnologías, estructura de carpetas e instrucciones estandarizadas de despliegue en desarrollo. Para detalles específicos, consultar los archivos `README.md`, `package.json` de cada subproyecto, y `pubspec.yaml` de móvil.