# --- Build stage: install dependencies ---
FROM node:24-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-fund --omit dev

# --- Final stage: minimal runtime image ---
FROM node:24-slim

LABEL org.opencontainers.image.authors="Peter Müller <peter@crycode.de> (https://crycode.de/)"

ENV USER=node \
    PORT=8080 \
    WORKDIR=/app \
    UPLOAD_DIR="/upload" \
    UPLOAD_TMP_DIR="/upload" \
    DISABLE_AUTO_PORT="1" \
    ENABLE_FOLDER_CREATION="" \
    INDEX_FILE="" \
    MAX_FILE_SIZE=200 \
    PATH_REGEXP="" \
    TOKEN=""

EXPOSE ${PORT}
WORKDIR ${WORKDIR}

# copy only runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY http-server-upload.js package.json README.md ./

RUN mkdir -p ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chown -R ${USER} ${WORKDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chmod 700 ${WORKDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR}

USER ${USER}

CMD [ "node", "http-server-upload.js" ]
