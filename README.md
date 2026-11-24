# ScanDev Frontend

Aplicación web independiente para ScanDev, construida con Next.js App Router, React y TypeScript. El frontend mantiene su propio repositorio y no importa código ni modelos del backend; la integración se realiza únicamente mediante la API HTTP.

## Desarrollo

Configura el origen local del backend y ejecuta el frontend en un puerto distinto:

```powershell
Copy-Item .env.example .env.local
npm run dev -- --port 3001
```

La API local debe estar disponible en `http://localhost:3000`; el frontend se abre en `http://localhost:3001`. En el archivo `.env.local` puedes cambiar `API_INTERNAL_URL`. Este valor es solo de servidor y no debe tener el prefijo `NEXT_PUBLIC_`.

```bash
npm install
```

## Validación

```bash
npm run lint
npm run typecheck
npm run build
```

## Despliegue seguro

- En Vercel, configura `API_INTERNAL_URL` en los entornos Preview y Production con el origen HTTPS del servicio Render, por ejemplo `https://<servicio>.onrender.com`. No agregues `/api` al valor.
- Vercel y Render gestionan los certificados TLS. En Vercel habilita **Enforce HTTPS**; la aplicación añade HSTS solo en Production y exige HTTPS para la API en Preview y Production.
- Mantén `.env.local` fuera de Git. No guardes tokens, cookies ni credenciales del backend en variables `NEXT_PUBLIC_*`.
- El navegador solo solicita rutas `/api/...` del mismo origen Vercel. El rewrite del servidor conserva la cookie `HttpOnly` sin exponer la URL del backend al código cliente.
- Las solicitudes que modifican datos requieren el origen exacto del frontend y JSON; las respuestas API no se cachean.

Al llamar la API mediante el mismo origen, el navegador no necesita CORS entre Vercel y Render. El backend debe mantener `Secure`, `HttpOnly` y `SameSite=Lax` en la cookie de sesión. El conteo de saltos de proxy confiables para rate limiting por IP debe corresponder a la cadena real Vercel → Render; confirma ese valor en ambos despliegues antes de producción.

## Licencia

Este repositorio se distribuye bajo la Licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para conocer los permisos y condiciones. La licencia cubre el material original de este repositorio; las dependencias y componentes de terceros conservan sus propias licencias.
