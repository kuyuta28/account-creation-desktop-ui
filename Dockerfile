FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --include=dev --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
# Pin worker count: cgroup-restricted runtimes may report 0 CPUs and spawn 0 workers.
RUN sed -i 's/^worker_processes  auto;/worker_processes  1;/' /etc/nginx/nginx.conf && \
    sed -i '/^user  nginx;/d' /etc/nginx/nginx.conf

# nginx unprivileged user needs writable cache/run dirs and an accessible pid path.
RUN mkdir -p /var/cache/nginx /run /usr/share/nginx/html /tmp/nginx && \
    chown -R nginx:nginx /var/cache/nginx /run /usr/share/nginx/html /tmp/nginx /var/log/nginx /etc/nginx/conf.d

USER nginx
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
