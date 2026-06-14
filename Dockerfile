# ──────────────────────────────────────────────────────────────────────────
# prisma-front — SPA React 19 + Vite servida con nginx
# Multi-stage: (1) build estático con Node, (2) runtime nginx liviano.
#
# ⚠️ Las variables VITE_* se "hornean" en build-time (Vite las inyecta en el
#    bundle). Para ECR/ECS pásalas como --build-arg al construir la imagen, NO
#    como variables de entorno del contenedor (en runtime ya no se leen).
#
#   docker build \
#     --build-arg VITE_API_BASE_URL=https://users.midominio.cl \
#     --build-arg VITE_DOCS_API_URL=https://docs.midominio.cl \
#     --build-arg VITE_API_PERFIL_ALUMNO_URL=https://perfil.midominio.cl \
#     --build-arg VITE_ADMIN_API_URL=https://admin.midominio.cl \
#     --build-arg VITE_CHAT_API_URL=https://chat.midominio.cl \
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

# VITE_* deben existir ANTES de `vite build` para quedar embebidas en el bundle.
ARG VITE_API_BASE_URL
ARG VITE_DOCS_API_URL
ARG VITE_API_PERFIL_ALUMNO_URL
ARG VITE_ADMIN_API_URL
ARG VITE_CHAT_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DOCS_API_URL=$VITE_DOCS_API_URL \
    VITE_API_PERFIL_ALUMNO_URL=$VITE_API_PERFIL_ALUMNO_URL \
    VITE_ADMIN_API_URL=$VITE_ADMIN_API_URL \
    VITE_CHAT_API_URL=$VITE_CHAT_API_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 2: runtime (nginx)
FROM nginx:1.27-alpine AS runtime

# Config con fallback SPA (history API → index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
