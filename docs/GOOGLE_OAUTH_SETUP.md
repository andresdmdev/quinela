# Google OAuth Configuration

## 1. Create Project in Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Sign in with your Google account.
3. In the project selector, click **New Project**.
4. Project name: `Quiniela Mundial 2026`.
5. Click **Create**.

## 2. Configure OAuth Consent Screen

> **Nota:** Google rediseñó el flujo en 2025–2026. La opción **External** ahora se configura dentro del nuevo **Google Auth Platform**, no en el menú anterior de APIs & Services.

1. Ve a [console.cloud.google.com/auth/branding](https://console.cloud.google.com/auth/branding) o navega a **Menú → Google Auth Platform → Branding**.
2. Si ves **"Google Auth Platform not configured yet"**, haz clic en **Get Started** (abre un wizard de 4 pasos).
3. **Paso 1 — App Information:**
   - App name: `Quiniela Mundial 2026`
   - User support email: tu correo
   - Haz clic en **Next**.
4. **Paso 2 — Audience:**
   - Selecciona **External** (para usuarios fuera de tu organización).
   - Haz clic en **Next**.
5. **Paso 3 — Data Access:** Sin cambios, haz clic en **Next**.
6. **Paso 4 — Finish:**
   - Agrega tu correo en **Contact Information**.
   - Acepta la política de datos de Google.
   - Haz clic en **Continue** y luego **Create**.
7. Una vez creado, ve a la pestaña **Audience** y en **Test users** agrega los correos de los 6 amigos.

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Quiniela Web App`.
5. In **Authorized redirect URIs**, add:

```text
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

Replace `<your-supabase-project>` with your project reference.

6. Click **Create**.
7. Copy the **Client ID** and **Client Secret**.

## 4. Configure in Supabase

1. Go to your Supabase project.
2. **Authentication → Providers → Google**.
3. Enable Google.
4. Paste the **Client ID** and **Client Secret**.
5. Save.

## 5. Configure Redirect URI in the App

The Astro endpoint `/api/auth/callback` will validate Google's code and create the session.

Make sure the callback URL sent from the frontend is:

```text
https://your-vercel-domain.com/api/auth/callback
```

For local development:

```text
http://localhost:4321/api/auth/callback
```

## 6. Test Login

1. Start the app locally.
2. Go to `/login`.
3. Click **Sign in with Google**.
4. Select a test user account.
5. You should be redirected to the dashboard.
