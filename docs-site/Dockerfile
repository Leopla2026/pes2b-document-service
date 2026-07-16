FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js
COPY swagger.html /usr/share/nginx/html/swagger.html
COPY openapi.json /usr/share/nginx/html/openapi.json

COPY downloads /usr/share/nginx/html/downloads
COPY openapi.json /usr/share/nginx/html/downloads/openapi.json

EXPOSE 80

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=5s \
  --retries=3 \
  CMD wget \
    --quiet \
    --tries=1 \
    --spider \
    http://127.0.0.1/health \
    || exit 1