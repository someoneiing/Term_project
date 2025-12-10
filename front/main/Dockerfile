FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY public public
COPY src src

ARG REACT_APP_API_URL
ARG REACT_APP_AI_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_AI_URL=${REACT_APP_AI_URL}

RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
