FROM node:22-bookworm AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /app/build/client /usr/share/nginx/html

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]