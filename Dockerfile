FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
