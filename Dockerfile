FROM node:22-bookworm

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.12.4 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm --version
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]