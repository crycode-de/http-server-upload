#!/bin/bash

set -e

cd $(dirname ${BASH_SOURCE[0]:-$0})

function cleanup {
  RV=$?

  rm -r tmp0 tmp1 tmp2
  if [ -n "$PID" ]; then
    kill -s SIGINT $PID 2>/dev/null
  fi

  if [ $RV -ne 0 ]; then
    echo -e "\n----- Error -----\n"
  fi
}

trap cleanup EXIT

echo -n "Node.js: "
node -v
echo -n "hhtp-server-upload: "
grep '"version":' ../package.json | cut -d'"' -f4

echo -e "\n----- Create files -----\n"

mkdir -p tmp0 tmp1 tmp2

echo "This is a test!" > tmp1/file.txt
dd if=/dev/urandom of=tmp1/file.bin bs=1024 count=1 2>/dev/null

echo ok

echo -e "\n----- Start server -----\n"

export UPLOAD_TMP_DIR=./tmp0/
export TOKEN=test-token
node ../http-server-upload.js &
PID=$!

sleep 1

echo -e "\n----- Upload files -----\n"

curl \
  -F "uploads=@tmp1/file.txt" \
  -F "uploads=@tmp1/file.bin" \
  -F "path=tmp2" \
  -F "token=$TOKEN" \
  http://localhost:8080/upload
echo

echo -e "\n----- Check files -----\n"
cmp tmp1/file.txt tmp2/file.txt
echo "file.txt ok"

cmp tmp1/file.bin tmp2/file.bin
echo "file.bin ok"

echo -e "\n----- Checks passed -----\n"
