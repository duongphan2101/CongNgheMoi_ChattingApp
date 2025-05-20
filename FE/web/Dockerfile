FROM node:23-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --force --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:23-slim
WORKDIR /app
COPY --from=builder /app/build /app/build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]



