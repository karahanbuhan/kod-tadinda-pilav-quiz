# 1. Aşama: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

# Native modüller (sqlite) için gerekli araçları yükle
RUN apk add --no-cache python3 make g++

# Paketleri yükle
RUN npm ci

# Kaynak kodları kopyala
COPY . .

# Uygulamayı derle (build klasörü oluşur)
RUN npm run build

# -----------------------------------------

# 2. Aşama: Production (Daha küçük imaj)
FROM node:20-alpine

WORKDIR /app

# Native modüller için runtime araçları (bazen gerekir)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Sadece production paketlerini yükle (better-sqlite3 yeniden derlenir)
RUN npm ci --omit=dev

# Builder'dan derlenmiş dosyaları al
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

# Static dosyaları da kopyalamamız lazım (resimler için)
# SvelteKit adapter-node static dosyaları build/client içine gömer ama garanti olsun.
COPY --from=builder /app/static ./static 

# Veritabanı için klasör aç
RUN mkdir -p data

# Portu aç
EXPOSE 3000

# Ortam değişkeni
ENV NODE_ENV=production

# Başlat
CMD ["node", "build/index.js"]