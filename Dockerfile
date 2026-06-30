# ──────────────────────────────────────────────────────────────────────────
# prisma-front — SPA React 19 + Vite servida por nginx, que además actúa como
# PUERTA ÚNICA (reverse-proxy) hacia los microservicios. Ver nginx.conf.template.
# Multi-stage: (1) build estático, (2) runtime nginx.
#
# El front NO usa Supabase client-side (auth va vía ms-users), así que NO hace
# falta ningún build-arg. Las URLs de los micros se buildean VACÍAS
# (.env.production) → el front llama same-origin (/api/..., /paci-profiles, /chat)
# y nginx rutea. La imagen se construye UNA vez y no se rehornea si cambian las
# direcciones internas.
#
#   docker build -t prisma-front .
# ──────────────────────────────────────────────────────────────────────────

# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# npm install (no npm ci): el front tiene deps con bindings nativos/wasm cuyas
# optionalDependencies son por-plataforma. El lock se versiona desde Windows y el
# build corre en Linux, así que la sincronía estricta de `npm ci` falla por las
# opcionales de Linux ausentes. `npm install` resuelve las correctas en el contenedor.
RUN npm install --no-audit --no-fund

COPY . .

# Forzamos las URLs a vacío en el build de producción → same-origin.
# Vite lee .env.production en `vite build`; con valor vacío, el front emite
# rutas relativas (/api/..., /chat/..., /health, /feedback/...) que nginx proxea.
# IMPORTANTE: el código usa VITE_BFF_URL (toda la API pasa por el BFF) y
# VITE_CHAT_API_URL (workflow). Deben quedar vacías para que axios use baseURL
# relativo same-origin (ver resolución con `??` en los services/constants).
RUN printf 'VITE_BFF_URL=\nVITE_CHAT_API_URL=\nVITE_DOCS_API_URL=\n' > .env.production

RUN npm run build

# Stage 2: runtime (nginx + reverse-proxy)
FROM nginx:1.27-alpine AS runtime

# La imagen oficial procesa /etc/nginx/templates/*.template con envsubst al
# arrancar y lo deja en /etc/nginx/conf.d/.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Direcciones internas. En una misma ECS task los contenedores comparten
# namespace de red, por eso los defaults apuntan a 127.0.0.1. nginx solo
# necesita 2 upstreams: el BFF (toda la API) y el workflow (chat/health/feedback).
# El reparto a users/docs/admin/perfil lo hace el BFF por su cuenta.
# Si luego se separan en services distintos, sobreescribir con Service Connect / Cloud Map.
ENV NGINX_RESOLVER=169.254.169.253 \
    BFF_UPSTREAM=127.0.0.1:3010 \
    WORKFLOW_UPSTREAM=127.0.0.1:8000

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
