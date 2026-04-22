# Guía de Despliegue: Antigravity SGC

Esta guía detalla cómo llevar el Sistema de Gestión de Calidad (SGC) de Ciudad Don Bosco a un entorno de producción público en Internet.

## Arquitectura de Producción Recomendada

Dado que la aplicación utiliza Next.js (Frontend + API Routes) y MySQL (Base de Datos), la topología más eficiente y económica es:
- **Frontend / Backend (Next.js):** Vercel
- **Base de Datos (MySQL):** Railway o PlanetScale
- **Auth & NoSQL Backup:** Firebase (ya configurado)

---

## Paso 1: Configurar la Base de Datos en la Nube (Railway)

1. Crea una cuenta en [Railway.app](https://railway.app/).
2. Haz clic en **New Project** > **Provision MySQL**.
3. Una vez creada, ve a las variables de la base de datos y copia la cadena de conexión (`DATABASE_URL`).
   - *Ejemplo:* `mysql://root:password@containers-us-west-xx.railway.app:3306/railway`
4. En tu entorno local, cambia la variable `DATABASE_URL` en tu archivo `.env` por la nueva URL de Railway.
5. Ejecuta en tu terminal local:
   ```bash
   npx prisma db push
   ```
   *Esto construirá las tablas en el servidor de Railway.*

---

## Paso 2: Despliegue en Vercel (Frontend & API)

1. Sube tu código a un repositorio privado en **GitHub**.
   ```bash
   git add .
   git commit -m "Preparación para producción"
   git push origin main
   ```
2. Inicia sesión en [Vercel](https://vercel.com/) y haz clic en **Add New...** > **Project**.
3. Importa tu repositorio de GitHub.
4. **IMPORTANTE:** Antes de hacer clic en "Deploy", despliega el menú **Environment Variables** y añade las siguientes variables tal cual están en tu `.env` local:
   - `DATABASE_URL` (La URL de Railway que obtuviste en el Paso 1).
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (Asegúrate de que los saltos de línea `\n` se copien correctamente).

5. Haz clic en **Deploy**. Vercel construirá y publicará la aplicación.

---

## Paso 3: Alternativa con Docker (Servidor Propio VPS)

Si el colegio prefiere utilizar su propio servidor (HostGator, AWS EC2, DigitalOcean), hemos incluido un `Dockerfile`.

1. En el servidor, clona el repositorio.
2. Crea el archivo `.env` en la raíz del proyecto.
3. Construye y ejecuta el contenedor:
   ```bash
   docker build -t antigravity-sgc .
   docker run -p 3000:3000 --env-file .env antigravity-sgc
   ```
4. El sistema estará disponible en el puerto `3000` de la IP del servidor.

---

## Consideraciones Post-Despliegue

- **Firebase Auth Domains:** Una vez que Vercel te dé la URL pública (ej. `sgc-donbosco.vercel.app`), debes ir a la consola de Firebase > Authentication > Settings > Authorized domains y agregar esa URL para que el Login con Google funcione.
- **Trazabilidad:** Al estar en producción, los logs de la Ley 1620 y las calificaciones se guardarán permanentemente. Asegúrate de hacer backups periódicos de tu base de datos en Railway.
