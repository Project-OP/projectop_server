FROM node:12

COPY ./build /server/build
COPY ./*.json ./server/
COPY ./static ./server/static

WORKDIR /server
RUN npm install
EXPOSE 3000

ENTRYPOINT ["npm","run","production"]

