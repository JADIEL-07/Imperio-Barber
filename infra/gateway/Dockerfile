FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY snippets/ /etc/nginx/snippets/
COPY html/backend-index.html /usr/share/nginx/backend/backend-index.html
COPY html/api-docs.html /usr/share/nginx/html/api-docs.html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
