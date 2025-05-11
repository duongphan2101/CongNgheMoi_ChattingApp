FROM node:23-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --force --legacy-peer-deps

COPY . .

CMD ["node", "src/index.js"]
