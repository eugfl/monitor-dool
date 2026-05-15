# Estágio 1: Build da aplicação
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Fazer o build de produção (Vite gera a pasta dist)
RUN npm run build

# Estágio 2: Servidor Nginx (muito mais leve e rápido para arquivos estáticos)
FROM nginx:alpine

# Limpar arquivos default do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar o build do React para a pasta do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar a configuração customizada do Nginx para lidar com rotas do React (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
