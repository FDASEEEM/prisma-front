# Informe técnico — Despliegue DevOps de P.R.I.S.M.A.

**Asignatura:** Fullstack III — EP2
**Sistema:** P.R.I.S.M.A. (Plataforma de Rúbricas Inteligentes para Material y Adecuaciones)
**Cuenta AWS (Learner Lab):** `120823341284`
**Rama de despliegue:** `aws-deploy` (aislada de `main`/`develop`)

> Este informe justifica las decisiones técnicas del despliegue. Cada sección
> describe lo efectivamente implementado en el repositorio. Donde algo quedó como
> mejora pendiente, se indica explícitamente (no se presenta como hecho).

---

## 1. Método de integración del sistema

P.R.I.S.M.A. es un conjunto de **microservicios independientes** (patrón *database-per-service*)
coordinados por un frontend SPA. La comunicación se organiza en tres capas:

| Componente | Stack | Puerto | Rol |
|------------|-------|--------|-----|
| **prisma-front** | React 19 + Vite + nginx | 80 | SPA + **puerta única** (reverse-proxy) |
| **prisma-ms-users** | NestJS 10 + Prisma 5 | 3001 | Auth + perfil docente (dueño de identidad) |
| **prisma-ms-docs** | NestJS 10 + Prisma 5 | 3000 | Documentos / jobs PACI |
| **prisma-ms-perfil-alumno** | NestJS 11 + Prisma 5 | 3005 | Estudiantes y perfiles PACI |
| **prisma-adminpanel** | NestJS 10 + Prisma 5 | 3004 | API del panel de administración |
| **prisma_workflow** | Python + FastAPI + google-adk | 8000 | Motor de IA multi-agente (Gemini) |

**Frontend ↔ Backend.** El navegador habla **solo con el front** (una sola IP/origen).
nginx actúa como reverse-proxy y enruta cada path al microservicio correspondiente
(`nginx.conf.template`):

- `/api/auth/` → ms-users
- `/api/jobs` → ms-docs
- `/api/admin/`, `/api/notifications` → adminpanel
- `/paci-profiles`, `/students` → ms-perfil-alumno
- `/chat/`, `/health`, `/feedback/` → prisma_workflow (con `proxy_buffering off` para streaming SSE)

Esto se decidió así para **eliminar el problema de CORS** y exponer un único punto
de entrada: el front se compila con las URLs de los micros **vacías** (`.env.production`),
de modo que emite rutas relativas (*same-origin*) que nginx proxea internamente.

**Backend ↔ Base de datos relacional.** Cada microservicio NestJS usa **Prisma 5**
como ORM contra **PostgreSQL** (instancia gestionada — Aiven/Neon). Patrón
*database-per-service*: no comparten modelos; se correlacionan por el `user_id` de
Supabase. ms-users y ms-docs usan `multiSchema` (esquemas `users` y `jobs` en una
misma instancia); adminpanel y perfil-alumno usan esquema propio. El cliente Prisma
se genera en build (`npx prisma generate`) y las migraciones se aplican como paso
aparte (`npx prisma migrate deploy`), nunca horneadas en la imagen.

**Identidad común.** Supabase Auth emite un JWT que es la "moneda común": el front lo
obtiene en ms-users y lo envía como `Authorization: Bearer <jwt>` a todos los servicios.
Cada servicio valida el JWT por su cuenta (ms-docs y perfil-alumno vía JWKS con `jose`;
adminpanel consultando a ms-users). **Solo ms-users** posee el `SERVICE_ROLE_KEY`.

---

## 2. Contenedores (Docker)

### 2.1 Imágenes por componente

Las **6 imágenes** usan build **multi-etapa** para minimizar el tamaño final y no
arrastrar el toolchain de compilación al runtime:

| Imagen | Base build | Base runtime | Usuario | Puerto |
|--------|-----------|--------------|---------|--------|
| ms-users / ms-docs / adminpanel / perfil-alumno | `node:20-alpine` | `node:20-alpine` | `node` (no-root) | 3001/3000/3004/3005 |
| prisma_workflow | `python:3.12-slim` | `python:3.12-slim` | `appuser` (uid 1001, no-root) | 8000 |
| prisma-front | `node:20-alpine` | `nginx:1.27-alpine` | nginx | 80 |

Decisiones comunes en los **NestJS**:
- Etapa *builder*: `npm ci` → `npx prisma generate` (target musl) → `npm run build`.
- Etapa *runtime*: `npm ci --omit=dev && npm cache clean --force` (solo deps de
  producción), copia de `dist/`, `prisma/` y `node_modules/.prisma` desde el builder.
- `apk add --no-cache openssl libc6-compat` (requeridos por el query engine de
  Prisma sobre Alpine/musl).
- `USER node` → el proceso corre sin privilegios.

El **workflow** instala las dependencias en un `venv` aislado en el builder y copia
solo `/opt/venv` al runtime slim (sin `build-essential`/`gcc`). Corre como `appuser`.

El **front** compila la SPA con Vite en el builder y la sirve con nginx; la misma
imagen hace de reverse-proxy. No requiere build-args (las URLs van same-origin).

### 2.2 Redes internas y orquestación local (Docker Compose)

`docker-compose.yml` levanta los 6 componentes para **probar la integración en local
antes de subir a ECR**. Docker Compose crea una **red bridge por defecto** donde cada
servicio es resoluble por su **nombre de servicio** (DNS interno de Docker):

- `adminpanel` llama a ms-users por `http://users:3001/api` (no `localhost`).
- El front (modo dev) usa `http://workflow:8000` como backend de chat.
- Cada servicio inyecta su `.env` con `env_file` (config/secretos) y recibe overrides
  puntuales con `environment` (p. ej. URLs servicio→servicio).

> Nota: el `docker-compose.yml` es solo para desarrollo local; **no** es la
> configuración de producción (esa es ECS, ver §5).

---

## 3. Registro de imágenes (Amazon ECR)

Se eligió **Amazon ECR** (no Docker Hub) por integración nativa con el resto del
stack AWS (IAM, ECS, CloudWatch) y por mantener las imágenes en la misma cuenta del lab.

**Flujo de publicación** (automatizado en GitHub Actions, §4):
1. `aws-actions/amazon-ecr-login@v2` autentica el Docker daemon contra ECR.
2. Paso *describe-or-create*: `aws ecr describe-repositories ... || aws ecr create-repository`
   (crea el repo si no existe, idempotente).
3. `docker build` + `docker push` de **dos tags por imagen**.

**Estrategia de tags (trazabilidad):**

| Tag | Propósito |
|-----|-----------|
| `:<github.sha>` | **Inmutable**, apunta al commit exacto → trazabilidad y rollback |
| `:latest` | **Móvil**, siempre la última build → lo que consume ECS |

Repositorios ECR: `prisma-front`, `prisma-ms-users`, `prisma-ms-docs`,
`prisma-adminpanel`, `prisma-ms-perfil-alumno`, `prisma-workflow`.

---

## 4. CI/CD (GitHub Actions)

Cada repositorio tiene un workflow `.github/workflows/deploy-ecr.yml` que se dispara
en **push a `aws-deploy`** (o manualmente con `workflow_dispatch`).

### 4.1 Diagrama del pipeline

```
  push a aws-deploy
        │
        ▼
  ┌───────────────────────────────────────────────────────────┐
  │  GitHub Actions (runner ubuntu-latest)                     │
  │                                                            │
  │  [1] Checkout            actions/checkout@v4               │
  │  [2] Configure AWS creds (access key + secret + SESSION)  │
  │  [3] Login to ECR        amazon-ecr-login@v2              │
  │  [4] Ensure ECR repo     describe || create               │
  │  [5] Build, tag & push   :<sha>  +  :latest  ──────────┐  │
  │  [6] Force ECS redeploy  update-service                 │  │
  └────────────────────────────────────────────────────────┼──┘
                                                            ▼
                              ┌──────────────┐      ┌───────────────┐
                              │  Amazon ECR  │◀─────│ docker push   │
                              └──────┬───────┘      └───────────────┘
                                     │ pull :latest
                                     ▼
                              ┌──────────────────────────────┐
                              │  ECS Fargate (prisma-app)     │
                              │  reinicia los 6 contenedores  │
                              └──────────────────────────────┘
```

### 4.2 Etapas

- **Build:** `docker build` multi-etapa de la imagen del componente.
- **Test:** *(ver nota)* Los proyectos incluyen suites de pruebas (Vitest en el front,
  Jest en los NestJS, pytest en el workflow), ejecutadas **localmente** durante el
  desarrollo. **El pipeline actual no corre un stage de tests automatizado**; queda
  identificado como mejora inmediata (añadir un job `npm test` / `pytest` previo al
  build, bloqueante).
- **Push de imagen:** doble tag `:<sha>` + `:latest` a ECR.
- **Deploy automatizado:** el workflow del front ejecuta
  `aws ecs update-service --cluster <ECS_CLUSTER> --service <ECS_SERVICE> --force-new-deployment`.
  Como los 6 contenedores viven en **una sola task/service**, ese único redeploy
  reinicia todo el stack con las imágenes `:latest` recién publicadas. Cluster y
  service son configurables vía *GitHub Variables* (`ECS_CLUSTER`, `ECS_SERVICE`).

---

## 5. Infraestructura en la nube (AWS)

### 5.1 Plataforma de despliegue: ECS Fargate

Se desplegó sobre **Amazon ECS con Fargate** (sin servidores EC2 que administrar).

**Decisión clave — una sola task con 6 contenedores.** El rol del Learner Lab
(`voclabs`) **bloquea AWS Cloud Map** (`servicediscovery:CreatePrivateDnsNamespace`
denegado), por lo que no es posible separar los servicios en 6 *services* con DNS
interno (Service Connect). La solución fue colocar **los 6 contenedores en una única
task definition**, comunicándose por **`localhost`** (comparten el namespace de red de
la task en modo `awsvpc`):

- front (nginx) → `127.0.0.1:3001 / 3000 / 3004 / 3005 / 8000`
- adminpanel → `127.0.0.1:3001/api`

Esto coincide con el enfoque enseñado en clase (todo en la misma task) y elimina la
dependencia de service discovery.

### 5.2 VPC, subredes, plataforma

- **VPC:** se usa la **VPC default** de la cuenta (indicación del docente: no construir
  VPC custom).
- **Subredes:** subredes **públicas** de la VPC default.
- **IP pública:** activada en la task (necesaria para *pull* de imágenes desde ECR y
  salida a internet hacia Gemini / Supabase / S3).
- **Plataforma:** **clúster ECS Fargate** (no EC2, no EKS). `desiredCount = 0` por
  defecto → formato demo "prender/apagar". **Sin ALB** (el front expone directamente
  el puerto 80 vía IP pública de la task).
- **Roles:** task role y execution role = **`LabRole`** (único rol asumible en el lab).

### 5.3 Grupos de seguridad

Un único **Security Group `prisma-sg`**:
- **Inbound:** solo **TCP 80** (el navegador hacia el nginx del front).
- **Outbound:** *allow all* (default). Como los SG son **stateful**, basta abrir la
  entrada en 80; las respuestas y las conexiones salientes (Gemini, Supabase, S3,
  PostgreSQL) están permitidas sin reglas adicionales.

Todo el tráfico backend (puertos 3000–8000) viaja por **loopback** dentro de la task,
nunca expuesto a la red → superficie de ataque mínima.

---

## 6. Configuración y secretos (mínimo privilegio)

**Gestión de variables/secretos en tres niveles:**

1. **GitHub Secrets** (por repositorio): las **4 credenciales temporales** del Learner
   Lab — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`,
   `AWS_REGION`. El CI las usa para autenticar contra ECR/ECS. Al ser temporales
   (~4 h), se renuevan cada reinicio del lab.
2. **Variables de entorno en la task definition de ECS:** los secretos de runtime de
   cada contenedor (claves de Gemini, `DATABASE_URL`, `SUPABASE_URL`, etc.) se inyectan
   como env vars del contenedor; **no se hornean en la imagen**.
3. **Archivos `.env` locales:** excluidos del repo mediante `.gitignore` y
   `.dockerignore` → los secretos nunca llegan a Git ni a la imagen.

**Principio de mínimo privilegio (IAM):**
- En el lab, todas las tareas asumen `LabRole` (no es posible crear roles a medida ni
  OIDC; restricción de Academy).
- A nivel de aplicación se aplica mínimo privilegio real: **solo ms-users** posee el
  `SUPABASE_SERVICE_ROLE_KEY` (puede crear usuarios). Los demás microservicios
  **solo conocen `SUPABASE_URL`** y validan el JWT contra el JWKS público — no pueden
  emitir ni falsificar identidades.

> Mejora identificada: en un entorno productivo real, migrar los secretos de runtime a
> **AWS Secrets Manager** (referenciados desde la task definition con `secrets:` +
> `valueFrom`) en vez de env vars en texto plano, y crear roles IAM dedicados por
> servicio con políticas acotadas.

---

## 7. Observabilidad

- **Logs del pipeline:** cada ejecución de GitHub Actions deja el log completo por paso
  (Checkout → Configure creds → Login ECR → Build/Push → Redeploy) en la pestaña
  **Actions** del repositorio. Permite ver, por ejemplo, un fallo de credenciales
  caducadas (`ExpiredTokenException`) o el `docker push` exitoso con su digest.
  *(Adjuntar capturas de un run en verde como evidencia.)*
- **Métricas de los recursos:** los contenedores envían sus logs a **CloudWatch Logs**
  mediante el driver `awslogs` configurado en la task definition; CloudWatch expone
  además métricas de **CPU/memoria** del servicio ECS (`CPUUtilization`,
  `MemoryUtilization`). *(Adjuntar captura del grupo de logs y del gráfico de métricas.)*

> Estado real verificado: el contenedor `front` tiene `logConfiguration` con `awslogs`
> operativo. Se recomienda **homologar `awslogs` en los 6 contenedores** de la task
> definition para tener trazas centralizadas de todo el stack (mejora menor).

---

## 8. Seguridad básica (endurecimiento)

| Práctica | Implementación |
|----------|----------------|
| **Imágenes base mínimas** | `node:20-alpine`, `python:3.12-slim`, `nginx:1.27-alpine` |
| **Multi-etapa** | El runtime no incluye toolchain de build (gcc, devDependencies) |
| **Usuario no-root** | `USER node` (NestJS) y `USER appuser` uid 1001 (workflow) |
| **Solo deps de producción** | `npm ci --omit=dev` + `npm cache clean --force` |
| **Puertos mínimos expuestos** | Cada imagen expone **un solo puerto**; el SG abre solo el **80** |
| **SG restrictivo** | `prisma-sg` inbound = únicamente TCP 80; resto por loopback |
| **Secretos fuera de la imagen** | `.dockerignore` + inyección por env en runtime |

> Mejora identificada: habilitar **escaneo de vulnerabilidades de ECR**
> (`scanOnPush = true`) sobre los repositorios, o integrar **Trivy** como paso del CI,
> para detectar CVEs en las imágenes antes del deploy. No está activo actualmente.

---

## 9. Orquestación y escalabilidad — ¿por qué ECS?

Se eligió **Amazon ECS (Fargate)** frente a un despliegue manual (p. ej. `docker run`
en una EC2) por las siguientes razones:

- **Sin servidores que administrar (Fargate):** no hay que aprovisionar, parchear ni
  escalar instancias EC2; AWS gestiona el plano de cómputo.
- **Despliegue declarativo:** la *task definition* versiona la infraestructura (imagen,
  CPU/memoria, puertos, env, logs). Reproducible y auditable, a diferencia de comandos
  manuales.
- **Auto-recuperación:** si un contenedor muere, el *service* de ECS levanta uno nuevo
  para mantener el `desiredCount` → resiliencia que un `docker run` manual no da.
- **Despliegues sin downtime:** `--force-new-deployment` hace *rolling update*
  (levanta la task nueva, drena la vieja) integrado con el pipeline CI/CD.
- **Escalabilidad:** ajustar capacidad es declarativo — subir `desiredCount` o
  configurar **Service Auto Scaling** por métricas de CloudWatch (CPU/memoria/requests).
  Manualmente habría que clonar y balancear instancias a mano.
- **Integración nativa:** IAM (roles de task), ECR (pull autenticado), CloudWatch
  (logs/métricas) funcionan de fábrica.

EKS (Kubernetes) se descartó por **sobre-ingeniería** para el alcance del proyecto:
mayor complejidad operativa y curva de aprendizaje sin beneficio para 6 contenedores
en un entorno académico de demo.

---

## 10. Diagrama de arquitectura de despliegue

```
                          Internet
                             │  HTTP :80
                             ▼
              ┌─────────────────────────────────┐
              │  Security Group  prisma-sg       │
              │  inbound: TCP 80 · outbound: all │
              └──────────────┬──────────────────┘
                             │
   AWS · VPC default · subred pública · IP pública
                             │
  ┌──────────────────────────────────────────────────────────────┐
  │  ECS Fargate · task  prisma-app  (modo awsvpc)                │
  │                                                               │
  │  ┌────────────┐  loopback 127.0.0.1                           │
  │  │ front:80   │───┬──────► users:3001                         │
  │  │ (nginx,    │   ├──────► docs:3000                          │
  │  │  puerta    │   ├──────► adminpanel:3004 ──► users:3001/api │
  │  │  única)    │   ├──────► perfil:3005                        │
  │  └────────────┘   └──────► workflow:8000                      │
  │                                                               │
  └───────┬─────────────────┬───────────────────┬────────────────┘
          │ salida          │ salida            │ salida
          ▼                 ▼                   ▼
   PostgreSQL          Supabase Auth        Gemini API
   (Aiven/Neon)        (JWT / JWKS)         (google-adk)

   CI/CD:  GitHub (push aws-deploy) → GitHub Actions → ECR → ECS redeploy
   Logs:   GitHub Actions (pipeline) · CloudWatch (contenedores)
```

> Para el entregable final reproducir este diagrama en **Draw.io / Lucidchart** y
> exportarlo como imagen dentro del Word.

---

## 11. Resumen de decisiones

| Tema | Decisión | Motivo |
|------|----------|--------|
| Punto de entrada | Front nginx como puerta única | Elimina CORS, 1 sola IP pública |
| Registro | Amazon ECR | Integración nativa AWS, tags sha + latest |
| CI/CD | GitHub Actions por repo, trigger `aws-deploy` | Aísla el deploy del proyecto original |
| Orquestación | ECS Fargate, 1 task / 6 contenedores | Cloud Map bloqueado en Academy → loopback |
| Red | VPC default, 1 SG (:80) | Indicación docente + superficie mínima |
| Secretos | GitHub Secrets + env en task def | Temporales del lab; `.env` fuera de Git |
| Identidad | Supabase JWT, SERVICE_ROLE solo en ms-users | Mínimo privilegio aplicado |

### Mejoras identificadas (honestidad técnica)
1. Añadir **stage de tests** bloqueante al pipeline (Vitest/Jest/pytest).
2. Homologar **`awslogs`** en los 6 contenedores.
3. Habilitar **escaneo de imágenes** en ECR (`scanOnPush`) o Trivy en CI.
4. Migrar secretos de runtime a **AWS Secrets Manager** con roles IAM por servicio.
