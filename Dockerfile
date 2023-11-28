FROM node:20

WORKDIR /app
COPY . .

ENV IN_CONTAINER=1

RUN yarn
RUN yarn global add pm2
RUN yarn build

CMD [ "pm2-runtime", "start", "index.js", "--output", "./pm2logs", "--error", "./pm2errors", "--name", "1119" ]


