FROM node:12.18.1

WORKDIR /usr/caro-api

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]