FROM node:20-slim

WORKDIR /app

RUN npm install -g npm@11

COPY . .

RUN npm ci --verbose

RUN cd client && npm ci --verbose

RUN cd client && npm run build

RUN npm run server-build

EXPOSE 3000

CMD ["npm", "start"]