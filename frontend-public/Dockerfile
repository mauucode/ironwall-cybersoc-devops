# Fase 1: Construcción (Build)
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Fase 2: Servidor de Producción (Nginx)
FROM nginx:stable-alpine
# Copiamos los archivos construidos de React a la carpeta de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]