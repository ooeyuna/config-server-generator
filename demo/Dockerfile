FROM {{ registry }}/{{ app }}:latest-cache AS previous

FROM nodejs:17-slim

RUN apt-get update && apt-get install -y \
  vim \
  nginx \
  curl \
  net-tools \
  && rm -rf /var/lib/apt/lists/*

WORKSPACE /app

COPY config-server-generator /app/config-server-generator

COPY scripts /app/scripts

COPY nginx /app/nginx

RUN cd /app/config-server-generator && yarn install --lock-frozon

COPY config /app/config

ENTRYPOINT ["/app/entrypoint.sh"]