FROM node:17-alpine

COPY ./build /server/build
COPY ./*.json ./server/
COPY ./static ./server/static

WORKDIR /server
RUN npm install
EXPOSE 3000

ENTRYPOINT ["npm","run","production"]

