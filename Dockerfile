FROM node:20

ENV USER node
ENV PORT 8080
EXPOSE ${PORT}
ENV WORDIR /app
WORKDIR ${WORDIR}

ENV UPLOAD_DIR "/upload"
ENV UPLOAD_TMP_DIR "/upload"
ENV MAX_FILE_SIZE 300
ENV TOKEN ""
ENV INDEX_FILE ""

# install dep
COPY package.json package-lock.json ${WORDIR}
RUN mkdir -p ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chown -R ${USER} ${WORDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR} && \
    chmod 700 ${WORDIR} ${UPLOAD_DIR} ${UPLOAD_TMP_DIR}

USER ${USER}
RUN npm install --no-fund --omit dev

# copy full app
COPY . ${WORDIR}

CMD node http-server-upload.js