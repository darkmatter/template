default:
  @just --list

dev:
  node apps/web/server.mjs

test:
  node --test tests/smoke.test.mjs

check:
  node --check apps/web/server.mjs
  node --check apps/web/public/app.js

container-config:
  docker compose -f ops/compose/local.yaml config

container-up:
  docker compose -f ops/compose/local.yaml up --build
