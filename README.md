# Panel de Desempeño — Seguimiento de Trabajadores

App web para dar seguimiento a las actividades, objetivos, progreso y pendientes de cada trabajador. Funciona en el navegador, sin instalar nada.

## ¿Qué hace?

- **Resumen**: tablero general con cumplimiento global, actividades en progreso, atrasadas y lista de pendientes.
- **Trabajadores**: tarjetas con el desempeño de cada persona. Clic en una tarjeta para ver su detalle y asignarle actividades.
- **Actividades**: todas las tareas con su objetivo, prioridad, estado, fecha límite y % de progreso. Con filtros y búsqueda.
- Detecta automáticamente las actividades **atrasadas** (fecha límite vencida y no cumplidas).
- **Respaldo / Importar**: descarga un archivo `.json` con todos los datos y vuelve a cargarlo cuando quieras (o en otra computadora).

## ¿Dónde se guardan los datos?

La app tiene **dos modos** y cambia sola según `config.js`:

- **Modo local** (claves vacías en `config.js`): los datos se guardan en el **navegador**
  (localStorage). Privado y gratis, sin login. Usa **⬇ Respaldo** / **⬆ Importar** para
  copias y para pasarlos entre dispositivos.
- **Modo nube** (con claves de Supabase): los datos viven en **Supabase** y se comparten
  entre tú y tus supervisores. Pide **iniciar sesión** con correo y contraseña.

👉 Para activar el modo nube sigue **[SUPABASE-PASOS.md](SUPABASE-PASOS.md)** (crear el
proyecto, correr `supabase-schema.sql`, crear usuarios y pegar las claves en `config.js`).

## Tema claro / oscuro

Botón 🌙 / ☀️ arriba a la derecha. La preferencia se recuerda.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio en GitHub y sube los archivos: `index.html`, `styles.css`, `app.js`, `config.js` (y opcionalmente `supabase-schema.sql` y los `.md`).
2. En el repo: **Settings → Pages**.
3. En *Source* elige la rama (`main`) y la carpeta `/ (root)`. Guarda.
4. En unos minutos estará en `https://TU-USUARIO.github.io/TU-REPO/`.

## Cómo abrirlo localmente

Solo abre `index.html` en tu navegador (doble clic). No necesita servidor.

---

### Archivos
- `index.html` — estructura de la página
- `styles.css` — diseño (temas claro/oscuro)
- `app.js` — toda la lógica (datos, formularios, cálculos, login)
- `config.js` — claves de Supabase (vacío = modo local)
- `supabase-schema.sql` — script para crear las tablas y la seguridad en Supabase
- `SUPABASE-PASOS.md` — guía paso a paso para conectar la nube

Los archivos `.claude/launch.json` y `.preview-server.cjs` son solo para previsualización local y no afectan la app publicada.
