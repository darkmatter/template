FROM node:22-alpine

WORKDIR /app
COPY apps/web/package.json ./package.json
COPY apps/web/server.mjs ./server.mjs
COPY apps/web/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
