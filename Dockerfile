# ──────────────────────────────────────────────────────────────────────────
# prisma-front — SPA React 19 + Vite servida por nginx, que además actúa como
# PUERTA ÚNICA (reverse-proxy) hacia los microservicios. Ver nginx.conf.template.
# Multi-stage: (1) build estático, (2) runtime nginx.
#
# Solo SUPABASE se hornea como build-arg (no dependen de ECS). Las URLs de los
# micros se buildean VACÍAS (.env.production) → el front llama same-origin
# (/api/..., /paci-profiles, /chat) y nginx rutea. Así la imagen se construye
# UNA vez y no hay que rehornear si cambian las direcciones internas.
#
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://<proj>.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=<anon-key> \
#     -t prisma-front .
# ──────────────────────────────────────────────────────────────────────────

# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Solo Supabase va horneado (es público y no depende de la red de ECS).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Forzamos las URLs de los micros a vacío en el build de producción → same-origin.
# Vite lee .env.production en `vite build`; con valor vacío, el front emite
# rutas relativas (/api/auth/login, /paci-profiles/..., /chat/...) que nginx proxea.
RUN printf 'VITE_API_BASE_URL=\nVITE_DOCS_API_URL=\nVITE_ADMIN_API_URL=\nVITE_API_PERFIL_ALUMNO_URL=\nVITE_CHAT_API_URL=\n' > .env.production

RUN npm run build

# Stage 2: runtime (nginx + reverse-proxy)
FROM nginx:1.27-alpine AS runtime

# La imagen oficial procesa /etc/nginx/templates/*.template con envsubst al
# arrancar y lo deja en /etc/nginx/conf.d/.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Direcciones internas de los micros (defaults = nombres del docker-compose).
# En ECS se sobreescriben en la task definition con los nombres de Service
# Connect / Cloud Map. NGINX_RESOLVER = DNS de la VPC para resolución dinámica.
ENV NGINX_RESOLVER=169.254.169.253 \
    USERS_UPSTREAM=users:3001 \
    DOCS_UPSTREAM=docs:3000 \
    ADMIN_UPSTREAM=adminpanel:3004 \
    PERFIL_UPSTREAM=perfil:3005 \
    WORKFLOW_UPSTREAM=workflow:8000

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
