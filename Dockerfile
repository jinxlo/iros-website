FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3003
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3003
CMD ["sh", "-c", "npm run build && npm run start -- -H 0.0.0.0 -p 3003"]
