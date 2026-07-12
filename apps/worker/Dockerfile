# Lead Booster Pro — pipeline worker.
# Based on the official Playwright image so Chromium (and all its system libs)
# are preinstalled for the scrape stage's JS-render fallback.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
ENV NODE_ENV=production
# Use the browsers baked into the base image.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# --- Install deps for the whole workspace (worker needs @lead/core) ----------
# Copy the manifests first so this layer caches on unchanged deps.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci

# --- Build core, then worker -------------------------------------------------
COPY packages/core packages/core
COPY apps/worker apps/worker
RUN npm run build --workspace packages/core \
  && npm run build --workspace apps/worker

# Drop dev dependencies for a lean runtime image.
RUN npm prune --omit=dev

CMD ["node", "apps/worker/dist/index.js"]
