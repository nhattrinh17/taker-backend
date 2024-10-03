FROM node:20-alpine

WORKDIR /nest
COPY package.json yarn.lock ./
RUN yarn

COPY . .
RUN  yarn build

EXPOSE 3000

CMD [ "node", "dist/main.js"]
