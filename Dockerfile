FROM node:20

LABEL org.opencontainers.image.authors="Peter Müller <peter@crycode.de> (https://crycode.de/)"

ENV USER node
ENV PORT 8080
EXPOSE ${PORT}
ENV WORDIR /app
WORKDIR ${WORDIR}

ENV UPLOAD_DIR "/upload"
ENV UPLOAD_TMP_DIR "/upload"

# default environment variables
ENV DISABLE_AUTO_PORT "1"
ENV ENABLE_FOLDER_CREATION ""
ENV INDEX_FILE ""
ENV MAX_FILE_SIZE 200
ENV PATH_REGEXP ""
ENV TOKEN ""

# copy app
COPY http-server-upload.js \
  package.json \
  package-lock.json \
  README.md \
  ${WORDIR}

# install dep
RUN mkdir -p ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chown -R ${USER} ${WORDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chmod 700 ${WORDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR}

USER ${USER}
RUN npm install --no-fund --omit dev

CMD node http-server-upload.js
