FROM ghcr.io/puppeteer/puppeteer:23.0.0

# Switch to root to set up the app directory
USER root

WORKDIR /app

# Copy files and install dependencies
COPY package.json .
COPY index.js .

RUN npm install

# Switch back to non-root user for security
USER pptruser

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "index.js"]
