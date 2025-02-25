FROM n8nio/n8n

USER root
RUN npm install -g pnpm

USER node
WORKDIR /home/node/.n8n
