# 🎵 MusicParty 1.0

Una plataforma interactiva de votación musical en tiempo real para eventos, boliches y fiestas. Los asistentes votan por las canciones que quieren escuchar mientras el DJ controla la experiencia desde un dashboard profesional.

## ✨ Características Principales

- **Votación en Vivo** — Los asistentes votan por canciones en tiempo real
- **Dashboard DJ Profesional** — Control total del evento, canciones y estadísticas
- **Modo Espejo** — Pantalla pública que muestra el ranking en vivo
- **QR Code** — Acceso fácil para que los asistentes voten escaneando
- **Analytics Completo** — Estadísticas detalladas de votación por evento
- **Pre-evento** — Permite que el público vote antes de que el evento comience
- **Planes Flexibles** — Demo, Starter, Pro y Agency con diferentes límites
- **Pago con MercadoPago** — Suscripciones en pesos argentinos

## 🏗️ Arquitectura del Proyecto

```
musicparty1.0/
├── backend/                 # NestJS + Prisma
│   ├── src/
│   │   ├── auth/           # Autenticación JWT
│   │   ├── events/         # Gestión de eventos
│   │   ├── songs/          # Gestión de canciones
│   │   ├── votes/          # Sistema de votación
│   │   ├── plan/           # Lógica de planes
│   │   ├── billing/        # Integración MercadoPago
│   │   └── prisma/         # ORM Prisma
│   ├── prisma/
│   │   └── schema.prisma   # Definición de BD
│   └── .env.example        # Variables de entorno
│
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dj/        # Dashboard y autenticación DJ
│   │   │   ├── public/    # Páginas públicas (votación, mirror)
│   │   │   └── events/    # Resumen y analytics de eventos
│   │   ├── components/     # Componentes reutilizables
│   │   ├── api/           # Cliente Axios
│   │   ├── hooks/         # Custom hooks
│   │   └── assets/        # Imágenes y estilos globales
│   └── index.html          # HTML raíz
│
├── mobile/                  # Flutter (próximamente)
│   └── README.md
│
└── docs/                   # Documentación
    └── API.md
```

## 🚀 Tecnologías Utilizadas

**Backend:**
- [NestJS](https://nestjs.com/) — Framework moderno para Node.js
- [Prisma](https://www.prisma.io/) — ORM type-safe para PostgreSQL
- [JWT](https://jwt.io/) — Autenticación segura
- [MercadoPago API](https://www.mercadopago.com.ar/developers) — Pagos en línea

**Frontend:**
- [React 18](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Build tool ultra-rápido
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Framer Motion](https://www.framer.com/motion/) — Animaciones suaves
- [Lucide React](https://lucide.dev/) — Iconografía moderna
- [Axios](https://axios-http.com/) — Cliente HTTP

**Otros:**
- [PostgreSQL](https://www.postgresql.org/) — Base de datos
- Docker (recomendado para desarrollo local)

## 📋 Requisitos Previos

- Node.js 18+ y npm/yarn
- PostgreSQL 12+
- Git
- Cuenta MercadoPago (para pagos)

## 🛠️ Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/musicparty1.0.git
cd musicparty1.0
```

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de BD y MercadoPago

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor (puerto 8080)
npm run start:dev
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "VITE_API_URL=http://localhost:8080/api" > .env.local

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

### 4. Acceder a la app

- **Dashboard DJ:** http://localhost:5173/dj/login
- **Votación Pública:** http://localhost:5173/event/:id
- **API:** http://localhost:8080/api

## 📱 Estructura de la Base de Datos

Las tablas principales incluyen:

- **DJUser** — Cuentas de DJ con planes y suscripciones
- **Event** — Eventos creados por DJs
- **Song** — Canciones en eventos
- **Vote** — Votos de los asistentes (anónimos por device_id)
- **EventTemplate** — Plantillas de playlists predefinidas

Ver `backend/prisma/schema.prisma` para detalles completos.

## 🔐 Autenticación y Seguridad

- **JWT Tokens** — Emitidos en login, incluyen DJ ID y expiran en 24h
- **Password Hashing** — Bcrypt con salt rounds = 10
- **CORS** — Configurado para el frontend local
- **Rate Limiting** — Implementado en endpoints de votación

## 💳 Sistema de Planes

| Plan | Eventos/mes | Votos/evento | Features |
|------|-------------|--------------|----------|
| **DEMO** | 10 | 50 | Básico |
| **STARTER** | 10 | 200 | +Analytics, Export, Pre-evento |
| **PRO** | ∞ | ∞ | Todo + MirrorMode HD |
| **AGENCY** | ∞ | ∞ | Todo + 5 cuentas DJ |

## 📊 Estadísticas en Vivo

El Dashboard DJ muestra en tiempo real:
- **Votos totales** de la sesión
- **Participantes únicos** (por device_id)
- **Engagement rate** (votos / participantes)
- **Ranking en vivo** de las 7 canciones más votadas
- **Análisis por hora** (gráficos)

## 🎨 Diseño y UX

- **Tema oscuro** con gradientes violeta/rosa
- **Glassmorphism** para cards modernos
- **Animaciones suaves** con Framer Motion
- **Responsive** — Mobile, tablet, desktop
- **Accesibilidad** — ARIA labels, contraste WCAG AA

## 📝 Scripts Disponibles

**Backend:**
```bash
npm run start:dev    # Desarrollo con hot-reload
npm run start:prod   # Producción
npm run test         # Tests unitarios
```

**Frontend:**
```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build para producción
npm run preview      # Preview de build
npm run lint         # ESLint
```

## 🔄 Flujo de Votación

1. DJ crea evento y obtiene URL única
2. DJ comparte QR o URL con asistentes
3. Asistentes escanean/acceden a `/event/:id`
4. Asistentes ven catálogo de canciones y votan
5. DJ ve ranking en vivo en dashboard
6. DJ marca canciones como reproducidas
7. Al cerrar, genera resumen con estadísticas

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Conectar repo a Vercel, se despliega automáticamente
```

### Backend (Railway, Render, Fly.io)
```bash
# Configurar variables de entorno en la plataforma
# Ejecutar migraciones: npx prisma migrate deploy
npm start
```

## 🐛 Troubleshooting

**"Error de conexión a BD"**
- Verificar que PostgreSQL esté corriendo
- Revisar `DATABASE_URL` en `.env`

**"Error de CORS"**
- Asegurarse que `FRONTEND_URL` esté configurado en backend
- Verificar puerto del frontend

**"Token inválido"**
- Limpiar localStorage: `localStorage.clear()`
- Re-login en DJ dashboard

## 📚 Documentación Adicional

- [API REST Completa](./docs/API.md)
- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [Estructura de Eventos](./docs/EVENTS.md)

## 👨‍💻 Contribuyendo

Las contribuciones son bienvenidas. Por favor:

1. Crea un branch: `git checkout -b feature/tu-feature`
2. Commit cambios: `git commit -m "Agregar feature X"`
3. Push: `git push origin feature/tu-feature`
4. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver [LICENSE](./LICENSE) para detalles.

## 📧 Contacto

Para soporte o preguntas:
- Email: info@musicparty.app
- Twitter: [@MusicPartyApp](https://twitter.com)

---

**MusicParty** — El poder de la música en tus manos 🎧
