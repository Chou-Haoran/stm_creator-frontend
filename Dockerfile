# ============================================================
# STM Creator — Frontend
# Multi-stage Docker build: deps → builder → runner (nginx)
#
# This is a static SPA (Vite + React). The final image contains
# only the compiled bundle served by nginx — no Node runtime.
#
# ── Build-time arguments (pass with --build-arg) ────────────
#   VITE_API_BASE_URL   Base URL of the backend REST API.
#                       Required for a functional deployment.
#                       Example: https://api.your-domain.com
#
#   VITE_COLLAB_URL     Socket.IO server URL for real-time
#                       collaboration. Optional — defaults to
#                       VITE_API_BASE_URL when not set.
#
#   VITE_MODEL_NAME     Default STM model name loaded by the
#                       demo dataset loader. Optional.
#
# ── Example build ───────────────────────────────────────────
#   docker build \
#     --build-arg VITE_API_BASE_URL=https://api.your-domain.com \
#     -t stm-creator-frontend .
#
# ── Example run ─────────────────────────────────────────────
#   docker run -p 80:8080 stm-creator-frontend
# ============================================================


# ── Stage 1: deps ───────────────────────────────────────────
# Install all npm dependencies using the lockfile so the result
# is byte-for-byte reproducible. Only package.json and the
# lockfile are copied in this stage, which means this expensive
# layer is cached and only re-runs when dependencies change —
# not on every source code change.
FROM node:20-alpine AS deps

WORKDIR /app

# Copy the manifest and lockfile before any source code.
COPY package.json package-lock.json ./

# --frozen-lockfile equivalent for npm: "ci" always uses the
# lockfile and fails if package.json and lock are out of sync.
RUN npm ci


# ── Stage 2: builder ────────────────────────────────────────
# Compile TypeScript and run the Vite production build.
#
# All VITE_ variables are baked into the JavaScript bundle at
# build time (Vite replaces import.meta.env.* statically).
# They CANNOT be changed at container runtime — if you need a
# different backend URL, rebuild the image with a new --build-arg.
FROM node:20-alpine AS builder

# Declare each build-time variable. Empty string is the default;
# the app falls back to its hardcoded production cloud URL when
# VITE_API_BASE_URL is not supplied.
ARG VITE_API_BASE_URL=""
ARG VITE_COLLAB_URL=""
ARG VITE_MODEL_NAME=""

# Re-export as environment variables so Vite can read them during
# the build (Vite reads from process.env, not just ARG).
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_COLLAB_URL=$VITE_COLLAB_URL \
    VITE_MODEL_NAME=$VITE_MODEL_NAME

WORKDIR /app

# Pull in the pre-installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree (node_modules is excluded by .dockerignore).
COPY . .

# tsc type-checks the project, then vite bundles it into dist/.
RUN npm run build


# ── Stage 3: runner ─────────────────────────────────────────
# Serve the static bundle with nginx. This stage contains no
# Node runtime and no source code — only the compiled artefact
# and the web server. This keeps the final image small.
FROM nginx:alpine AS runner

LABEL org.opencontainers.image.title="STM Creator Frontend" \
      org.opencontainers.image.source="https://github.com/ibraKH/stm-creator" \
      org.opencontainers.image.licenses="MIT"

# Replace the default nginx virtual-host config with our SPA-
# aware config (SPA fallback, gzip, cache headers, health check).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output from the builder stage.
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a dedicated non-root user and fix up every path that
# nginx writes to at runtime (cache, logs, pid file).
#
# Why port 8080 instead of 80?
# Non-root processes cannot bind to ports < 1024 on Linux without
# CAP_NET_BIND_SERVICE. Using 8080 lets us run without elevated
# privileges. Map 80 → 8080 at the host or load-balancer level:
#   docker run -p 80:8080 stm-creator-frontend
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    # The 'user nginx;' directive in the main nginx.conf instructs
    # the master process to switch workers to the 'nginx' user.
    # Because our master is already a non-root user, that switch
    # would fail with a permission error — so we remove the line.
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    # Grant appuser write access to every path nginx touches.
    && chown -R appuser:appgroup \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

# Switch to the non-root user before starting the process.
USER appuser

# nginx listens on 8080 (see nginx.conf and the note above).
EXPOSE 8080

# Poll the dedicated health endpoint every 30 s.
# A fresh container gets a 10 s grace period before checks start.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
