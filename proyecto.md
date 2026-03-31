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

### Última actualización: 24/03/2026

Este documento resume el estado actual del proyecto MusicParty, incluyendo tecnologías, dependencias y estructura de carpetas. Para detalles específicos, consultar los archivos README.md y package/pubspec.yaml de cada subproyecto.
### Última actualización: 24/03/2026

Este documento resume el estado actual del proyecto MusicParty (web/dj), incluyendo tecnologías, dependencias y estructura de carpetas. Para detalles específicos, consultar los archivos README.md y package.json de cada subproyecto.