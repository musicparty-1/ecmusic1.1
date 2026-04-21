# EC Music - Manual de Usuario

Bienvenido a **EC Music**, la plataforma interactiva que permite a DJs, bandas y organizadores de eventos interactuar con su público en tiempo real permitiéndoles votar por las próximas canciones a sonar.

Este manual está dividido en dos partes: **Para el DJ/Organizador** (Panel de Control Web) y **Para el Público/Asistentes** (Aplicación Móvil).

---

## 🎧 Parte 1: Para el DJ / Organizador

El panel del DJ es el centro de control del evento. Desde aquí puedes crear fiestas, agregar canciones, proyectar el código QR y administrar las votaciones.

### 1. Inicio de Sesión
1. Ingresa a la URL del panel web (Ejemplo en desarrollo: `http://localhost:5177/dj/login`).
2. Ingresa tus credenciales. 
   > *(Usuario de prueba: `dj@ecmusic.com` / Contraseña: `dj123456`)*.

### 2. Creación de un Evento
1. Haz clic en el botón **"+ Nuevo evento"** o **"Crear evento"**.
2. Ingresa el **Nombre** del evento (Ej: "Fiesta de Fin de Año") y el **Lugar / Venue** (Ej: "Salón Principal").
3. Haz clic en Crear. ¡Tu evento estará en estado PENDIENTE!

### 3. El Dashboard del DJ
Al ingresar a un evento, tendrás acceso a los siguientes controles principales:

* **Buscador y Catálogo de Canciones:** Agrega canciones rápidamente buscando por nombre o artista. Estas aparecerán en el "Ranking Activo" con 0 votos al inicio.
* **Marcar como reproducida (✔️):** Cuando pongas una canción en la vida real, haz clic en el botón verde ✔️ al lado de la canción en el panel. Esto la quitará de la cola y sumará a tus estadísticas de canciones reproducidas.
* **Panel Superior (Top Bar):** Muestra el estado del evento (EN VIVO), tiempo transcurrido, total de votos recibidos, personas conectadas simultáneamente y canciones sonadas.

### 4. Modo Proyector (Mirror Mode)
En la barra superior, encontrarás un botón llamado **"PROYECTAR"** o **"Modo Espejo"**. 
* Haz clic aquí y pon la pantalla completa en un monitor externo o proyector gigante en la pista de baile.
* Esta pantalla muestra un **Código QR gigante**, el Top de canciones votadas en tiempo real y una animación musical. El público solo tiene que escanear la pantalla para empezar a interactuar.

### 5. Configuración Avanzada (Engranaje ⚙️)
Al lado de tu perfil, el botón de ajustes te permite:
* **Modo Recital:** *(ON/OFF)* Pensado para bandas en vivo. Si lo activas, **bloquea las votaciones del público**. La gente escanea el QR y ve tu lista de canciones (setlist), pero no puede votar ni agregar temas.
* **Votos por persona:** Puedes limitar a que cada invitado en la pista solo pueda emitir 1, 3, 5 o 10 votos en total para evitar spam.

### 6. Cierre del Evento y Analíticas
* Cuando termine la noche, presiona el botón rojo de **"CERRAR EVENTO"** (Power).
* Esto finalizará las conexiones, cerrará las encuestas y te generará un reporte.
* Desde el menú de "Mis Eventos" puedes entrar al **Resumen / Analytics** de cualquier evento pasado y **Exportar en formato CSV** los datos para analizar qué géneros o canciones gustaron más.

---

## 📱 Parte 2: Para los Asistentes (El Público)

La aplicación para el público está diseñada para ser ultra-rápida y no requiere que nadie se registre ni deje correos.

### 1. Unirse a un Evento
1. Abre la cámara del celular y **escanea el Código QR** mostrado en la pantalla gigante (Modo Proyector) o abre la Aplicación Móvil EC Music.
2. Si el evento está **EN VIVO**, entrarás automáticamente a la lista de canciones de la fiesta.

### 2. Votar por una Canción
1. Desliza hacia arriba para ver el listado de temas que el DJ ha propuesto.
2. Si tienes en mente una canción, usa la **barra de búsqueda**.
3. Haz clic en el botón morado de **"VOTAR"** al lado de tu canción favorita.
4. Tu voto impactará inmediatamente en el ranking y verás cómo tu canción sube de posición (o incluso se marca con un fueguito 🔥).

### 3. Reglas de Votación
* Fíjate en la **barra de progreso** en la parte superior. Esta indica cuántos votos tienes disponibles (Ej: 3/3).
* Si ya votaste por una canción, puedes **cancelar tu voto** tocando de nuevo el botón para devolvértelo y usarlo en otro tema.
* Si te quedas sin votos, solo te queda esperar a que el DJ reproduzca los temas y disfrutar la música.

### 4. Modo Recital (El artista elige)
Si al entrar ves el mensaje *"El artista elige lo que sigue"*, significa que el evento está en **Modo Recital**. En este modo no puedes votar, pero podrás ver exactamente qué canciones está tocando y va a tocar la banda o artista a continuación.

---

> **💡 Soporte:** EC Music está en constante actualización. Si tienes dudas o sugerencias, no dudes en contactar a tu proveedor tecnológico.
