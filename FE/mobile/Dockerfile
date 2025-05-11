FROM node:23-slim

WORKDIR /app

# Cài các dependency cần thiết cho việc build mobile app
RUN apt update && apt install -y curl git python3 make gcc g++ libtool

# Cài expo-cli
RUN npm install -g expo-cli

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài các dependencies
RUN npm install --legacy-peer-deps

# Copy toàn bộ mã nguồn vào container
COPY . .

# Cổng mà Expo sử dụng
EXPOSE 19000 19001 19002

# Chạy Expo trong chế độ tunnel
CMD ["npx", "expo", "start", "--tunnel"]

