FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

COPY client/package*.json ./client/

RUN npm install
RUN cd client && npm install

COPY . .

RUN cd client && npm run build

RUN npm run server-build

EXPOSE 3000

CMD ["npm", "start"]