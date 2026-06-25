# Conectar el panel a Supabase (paso a paso)

Supabase es gratis para empezar. Con esto, los datos se guardan en la nube y se
comparten entre tú y tus supervisores, y cada quien entra con su correo y contraseña.

> Mientras no completes esto, la app sigue funcionando en **modo local** (datos en tu
> navegador). En cuanto pongas las claves en `config.js`, cambia sola a **modo nube con login**.

---

## 1. Crear el proyecto (5 min)

1. Entra a **https://supabase.com** y crea una cuenta (puedes usar tu correo o GitHub).
2. Clic en **New project**.
3. Ponle un nombre (ej. `panel-desempeno`), define una **contraseña de base de datos**
   (guárdala) y elige la región más cercana. Crear.
4. Espera 1–2 minutos a que se aprovisione.

## 2. Crear las tablas y la seguridad (2 min)

1. En el menú izquierdo entra a **SQL Editor** → **New query**.
2. Abre el archivo `supabase-schema.sql` de este proyecto, copia **todo** su contenido,
   pégalo y dale **Run**.
3. Debe decir *Success*. Esto crea las tablas `workers` y `activities` y las reglas de acceso.

## 3. Activar el inicio de sesión por correo (1 min)

1. Menú izquierdo → **Authentication** → **Providers**.
2. Asegúrate de que **Email** esté **activado**.
3. (Recomendado) En la configuración de Email, **desactiva "Confirm email"** para que
   los usuarios que crees puedan entrar de inmediato sin tener que confirmar el correo.

## 4. Crear los usuarios (tú + supervisores) (2 min)

1. Menú izquierdo → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe el **correo** y una **contraseña** para ti. Repite para cada supervisor.
3. Solo estas personas podrán entrar. Nadie se registra solo.

## 5. Copiar las claves a la app (1 min)

1. Menú izquierdo → **Project Settings** (engrane) → **API**.
2. Copia:
   - **Project URL**  → pégalo en `SUPABASE_URL` dentro de `config.js`
   - **Project API keys → `anon` `public`** → pégalo en `SUPABASE_ANON_KEY`
3. Guarda `config.js`. Ejemplo:

```js
window.SUPABASE_URL = "https://abcd1234efgh.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6...";
```

> La `anon key` es **pública por diseño**: es segura para ponerla en el navegador.
> La seguridad real la dan las reglas RLS y el login que ya configuraste.

## 6. Probar

1. Abre la app (local o en GitHub Pages). Ahora te pedirá **iniciar sesión**.
2. Entra con el correo y contraseña que creaste en el paso 4.
3. Agrega un trabajador y una actividad. Recarga la página: los datos siguen ahí
   (ahora viven en la nube y los ven todos los usuarios autorizados).

---

## Pasar tus datos locales a la nube

Si ya capturaste datos en modo local y quieres conservarlos:
1. **Antes** de poner las claves, abre la app en modo local y usa **⬇ Respaldo** (descarga un `.json`).
2. Pon las claves en `config.js`, recarga e **inicia sesión**.
3. Usa **⬆ Importar** y selecciona ese `.json`. Se subirá todo a Supabase.

## Notas
- Para **quitar** el acceso a alguien: Authentication → Users → elimina su usuario.
- Para **cambiar** una contraseña: Authentication → Users → el usuario → opciones.
- Si quieres volver al modo local, deja vacías las claves en `config.js`.
