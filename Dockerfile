FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# npm install (not npm ci) is required here: package-lock.json pins the
# @esbuild/* optional binaries per-OS, and on linux/x64 the netbsd-arm64
# entry makes npm ci fail with EBADPLATFORM before vite/rollup can build.
# A plain install with --include=dev still skips incompatible optionals
# when combined with --no-optional, and we get vite/rollup for the build.
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --include=dev --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
# Pin the worker count. The default upstream `worker_processes auto` derives
# the count from /proc/cpuinfo; some sandboxed / cgroup-restricted runtimes
# surface 0 CPUs and nginx master then spawns 0 workers, silently dropping
# every connection (no error log line, just hung sockets). Hardcode 1
# worker — the dev stack is single-tenant and never load-tests this path.
RUN sed -i 's/^worker_processes  auto;/worker_processes  1;/' /etc/nginx/nginx.conf
# Run nginx master as root so it can chown cache dirs (the entrypoint
# script does this). Workers still drop to the unprivileged `nginx` user.
# With cap_drop: ALL the entrypoint chown would otherwise fail with EPERM
# and the container restart-loops before serving a single request.
RUN sed -i 's/^user  nginx;/user  root;/' /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
