# Stage 1: Compilación de la aplicación React PWA
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Servidor Nginx de Producción
FROM nginx:alpine

# Copiar el build compilado del admin PWA
COPY --from=builder /app/dist /usr/share/nginx/html/admin

# Puerto HTTP estándar
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
