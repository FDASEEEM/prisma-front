# P.R.I.S.M.A. — Frontend (SPA + puerta única)

SPA en **React 19 + Vite** que, además de ser la interfaz del docente, actúa como
**puerta única** del sistema P.R.I.S.M.A.: en producción se sirve con **nginx**, que
hace de *reverse-proxy* hacia los microservicios. El navegador solo habla con el front.

> **P.R.I.S.M.A.** apoya a docentes del sistema escolar chileno en la generación de
> material y rúbricas de evaluación adaptadas para estudiantes con Necesidades
> Educativas Especiales (NEE), a partir del PACI y un material base, mediante un motor
> de IA multi-agente. Marcos normativos: Decretos 170/2010, 83/2015 y 67/2018.

## Arquitectura del sistema

| Componente | Stack | Puerto | Rol |
|------------|-------|--------|-----|
| **prisma-front** (este repo) | React 19 + Vite + nginx | 80 | SPA + reverse-proxy |
| prisma-ms-users | NestJS 10 + Prisma 5 | 3001 | Auth + perfil docente |
| prisma-ms-docs | NestJS 10 + Prisma 5 | 3000 | Documentos / jobs PACI |
| prisma-ms-perfil-alumno | NestJS 11 + Prisma 5 | 3005 | Estudiantes y perfiles PACI |
| prisma-adminpanel | NestJS 10 + Prisma 5 | 3004 | API panel de administración |
| prisma_workflow | Python + FastAPI + google-adk | 8000 | Motor de IA multi-agente (Gemini) |

Identidad común vía **Supabase JWT**. El front lo obtiene en ms-users y lo envía como
`Authorization: Bearer <jwt>` a todos los servicios.

## Desarrollo local

```bash
npm install
npm run dev        # dev server en :3002
npm run build      # build de producción → dist/
npm run preview    # sirve el build
npm test           # Vitest
```

Variables (`.env`): `VITE_API_BASE_URL` (users), `VITE_DOCS_API_URL` (docs),
`VITE_ADMIN_API_URL` (admin), `VITE_API_PERFIL_ALUMNO_URL` (perfil), y el chat por
proxy de Vite (`CHAT_BACKEND_URL`).

### Levantar todo el stack en local (Docker Compose)

Desde la carpeta `EP2/`:

```bash
docker compose up --build      # construye y levanta los 6 componentes
docker compose logs -f front   # ver logs de un servicio
docker compose down            # apagar
```

## Despliegue (rama `aws-deploy`)

El despliegue DevOps vive en la rama **`aws-deploy`**, aislada de `main`/`develop`:

- **Docker:** `Dockerfile` multi-etapa → build Vite + runtime nginx (reverse-proxy,
  `nginx.conf.template`).
- **CI/CD:** `.github/workflows/deploy-ecr.yml` → en push a `aws-deploy` construye la
  imagen, la publica en **Amazon ECR** (`:<sha>` + `:latest`) y fuerza el redeploy del
  service ECS (`update-service --force-new-deployment`).
- **Infra:** ECS Fargate, una sola task con los 6 contenedores comunicados por
  `localhost`; Security Group con inbound solo TCP 80; VPC default.

Detalle completo y justificación de cada decisión en **[`INFORME.md`](./INFORME.md)**.

## Estructura

```
src/
  pages/        Login, Dashboard, NuevaSesion, Sesion, Historial, Admin, Soporte
  services/     authService, chatService, jobsService, paciService, adminPanelService
  context/      AuthContext, ActiveSessionContext
  components/   UI + layout
Dockerfile            build Vite → nginx (puerta única)
nginx.conf.template   reverse-proxy a los microservicios
```
