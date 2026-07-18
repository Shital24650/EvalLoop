FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY backend ./backend
COPY frontend ./frontend
COPY api ./api
RUN npm install && npm --prefix frontend install && npm --prefix frontend run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "backend/server.js"]
