FROM node:20

WORKDIR /app
COPY . .

ENV IN_CONTAINER=1

RUN pnpm install
RUN pnpm --global add pm2
RUN pnpm run build

CMD [ "pm2-runtime", "start", "index.js", "--output", "./pm2logs", "--error", "./pm2errors", "--name", "1119" ]


