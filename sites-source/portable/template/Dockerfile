FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN node tools/pnpm/dist/pnpm.mjs install --frozen-lockfile && node tools/pnpm/dist/pnpm.mjs prisma generate && node tools/pnpm/dist/pnpm.mjs build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 DATABASE_URL=file:/app/data/quiz.db
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/lib/db.ts /app/lib/local-auth.ts ./lib/
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tools ./tools
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","scripts/container-start.mjs"]
