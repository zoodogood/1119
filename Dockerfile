FROM node:19
ENV DOCKER=1

WORKDIR /app
COPY . .

# RUN curl -fsSL https://bun.sh/install | bash

RUN npm install -g bun

RUN ls

RUN cp 
RUN bun run build


CMD [ "bun", "start" ]

