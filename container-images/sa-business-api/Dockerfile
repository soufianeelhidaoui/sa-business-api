FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
ENTRYPOINT ["/app/container-images/sa-business-api/entrypoint.sh"]
