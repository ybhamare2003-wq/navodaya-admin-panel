FROM node:22-slim

WORKDIR /app

COPY . .

RUN npm install

RUN cd client && npm install

RUN cd client && npm run build

RUN npm run server-build

EXPOSE 3000

CMD ["npm", "start"]