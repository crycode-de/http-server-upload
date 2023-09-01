#!/usr/bin/env node
/*
 * HTTP Server Upload
 *
 * Simple zero-configuration command-line http server which provides a lightweight interface to upload files.
 *
 * https://github.com/crycode-de/http-server-upload
 *
 * MIT license
 * Copyright (c) 2019-2023 Peter Müller <peter@crycode.de> https://crycode.de
 */
'use strict';

import http from 'node:http';
import { IncomingForm } from 'formidable';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

let port = process.env.PORT || 8080;
let disableAutoPort = !!process.env.DISABLE_AUTO_PORT;
let uploadDir = process.env.UPLOAD_DIR || process.cwd();
let uploadTmpDir = process.env.UPLOAD_TMP_DIR || uploadDir;
let token = process.env.TOKEN || false;
let pathMatchRegExp = (process.env.PATH_REGEXP) ? new RegExp(process.env.PATH_REGEXP) : /^[a-zA-Z0-9-_/]*$/;
let maxFileSize = (parseInt(process.env.MAX_FILE_SIZE, 10) || 200) * 1024 * 1024;
let enableFolderCreation = !!process.env.ENABLE_FOLDER_CREATION;

console.log('HTTP Server Upload');

// parse arguments
let uploadDirSetFromArg = false;
const myArgs = process.argv.slice(2);

// help requested?
if (myArgs.includes('--help') || myArgs.includes('-h')) {
  console.log(`A Simple zero-configuration command-line http server for uploading files.

The optional configuration is done by command line arguments or environment variables.
If both are used, the arguments have higher priority and the value from the corresponding environment variable will be ignored.

Usage:
  http-server-upload [arguments] [uploadRootPath]

Argument | Environmen variable
  Description [Default value]

--port | PORT
  The port to use. [8080]
--upload-dir | UPLOAD_DIR
  The directory where the files should be uploaded to.
  This overrides the uploadRootPath argument.
   [uploadRootPath argument or the current working directory]
--upload-tmp-dir | UPLOAD_TMP_DIR
  Temp directory for the file upload. [The upload directory]
--max-file-size | MAX_FILE_SIZE
  The maximum allowed file size for uploads in Megabyte. [200]
--token | TOKEN
  An optional token which must be provided on upload. [Nothing]
--path-regexp | PATH_REGEXP
  A regular expression to verify a given upload path.
  This should be set with care, because it may allow write access
  to outside the upload directory. [/^[a-zA-Z0-9-_/]*$/]
--disable-auto-port | DISABLE_AUTO_PORT
  Disable automatic port increase if the port is nor available. [Not set]
--enable-folder-creation | ENABLE_FOLDER_CREATION
  Enable automatic folder creation when uploading file to non-existent folder. [Not set]
--help or -h
  Show this help text.

Examples:

PORT=9000 UPLOAD_DIR=~/uploads/ UPLOAD_TMP_DIR=/tmp/ TOKEN=my-super-secret-token http-server-upload

http-server-upload --port=9000 --upload-dir="c:\\users\\peter\\Path With Whitespaces\\"

PORT=9000 http-server-upload --disable-auto-port --enable-folder-creation ./

Additional information:
  https://github.com/crycode-de/http-server-upload
`);
  process.exit(0);
}

while (myArgs.length > 0) {
  const arg = myArgs.shift();
  if (arg.startsWith('--')) {
    // it's an option ...

    let [ key, val ] = arg.split(/=(.*)/); // --dir=test=123 will give ['--dir','test=123','']

    // options without values
    if (key === '--disable-auto-port') {
      disableAutoPort = true;
      continue;
    }
    if (key === '--enable-folder-creation') {
      enableFolderCreation = true;
      continue;
    }

    // options with values - get value from next arg if not provided by --arg=val
    if (typeof val === 'undefined') {
      val = myArgs.shift();

      if (typeof val === 'undefined') {
        console.warn(`WANRING: No value given for command line argument: ${key}`);
        continue;
      }
    }

    switch (key) {
      case '--port':
        port = val;
        break;
      case '--dir':
      case '--upload-dir':
        if (uploadDir === uploadTmpDir) {
          uploadTmpDir = val;
        }
        uploadDir = val;
        uploadDirSetFromArg = true;
        break;
      case '--tmp-dir':
      case '--upload-tmp-dir':
        uploadTmpDir = val;
        break;
      case '--token':
        token = val;
        break;
      case '--path-regexp':
        pathMatchRegExp = new RegExp(val);
        break;
      case '--max-size':
      case '--max-file-size':
        maxFileSize = (parseInt(val, 10) || 200) * 1024 * 1024;
        break;

      default:
        console.warn(`WANRING: Unknown command line argument: ${key}`);
    }

  } else {
    // only set the upload dir from an argument if not already set
    if (!uploadDirSetFromArg) {
      if (uploadDir === uploadTmpDir) {
        uploadTmpDir = arg;
      }
      uploadDir = arg;
      uploadDirSetFromArg = true;
    }
  }
}

console.log(`Upload target dir is ${uploadDir}`);

/**
 * Cleanup uploaded temp files.
 * @param {import('formidable').File[] | undefined} uploads
 */
async function cleanupUploads (uploads) {
  if (!uploads) return;

  for (const file of uploads) {
    if (!file) continue;
    try {
      await fs.unlink(file.filepath);
    } catch (err) {
      console.log(`Error removing temporary file! ${file.filepath} ${err}`);
    }
  }
}

// create the server instance
const server = http.createServer();

// handle requests
server.on('request', async (req, res) => {

  if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
    // handle upload
    const form = new IncomingForm({
      uploadDir: uploadTmpDir,
      multiples: true,
      maxFileSize: maxFileSize,
    });

    let fields;
    let files;
    try {
      [ fields, files ] = await form.parse(req);
    } catch (err) {
      console.log(new Date().toUTCString(), `- Error parsing form data: ${err.message}`);
      res.statusCode = 400; // Bad Request
      res.write(`Error parsing form data! ${err.message}`);
      return res.end();
    }

    if (token && (!fields.token || fields.token[0] !== token)) {
      res.statusCode = 401; // Unauthorized
      res.write('Wrong token!');
      await cleanupUploads(files.uploads);
      return res.end();
    }

    // check if any files are uploaded
    if (!files.uploads) {
      res.statusCode = 400; // Bad Request
      // If a file is uploaded without Content-Type given for the multipart part
      // it's parsed as a string field and not as file. Send a detailed error
      // message in this case.
      if (fields.uploads) {
        res.write('No files uploaded! A field called "uploads" is preset but there was probably missing the "Content-Type" for it. Check the docs how to solve this.');
      } else {
        res.write('No files uploaded!');
      }
      await cleanupUploads(files.uploads);
      return res.end();
    }

    let targetPath = uploadDir;

    if (fields.path && typeof fields.path[0] === 'string') {
      if (!fields.path[0].match(pathMatchRegExp)) {
        res.statusCode = 400; // Bad Request
        res.write('Invalid path!');
        await cleanupUploads(files.uploads);
        return res.end();
      }

      targetPath = path.join(uploadDir, fields.path[0]);
    }

    // check if target folder exists - if not create it if folder creation is enabled
    try {
      // get path stats and expect an error if not exists
      await fs.stat(targetPath);

    } catch (err) {
      // path does not exist
      if (enableFolderCreation) {
        console.log(`Target path ${targetPath} does not exist, creating it`);
        try {
          await fs.mkdir(targetPath, { recursive: true });
        } catch (err2) {
          console.log(`Error creating target path! ${err2}`);
          res.statusCode = 500; // Internal Server Error
          res.write(`Error creating target path! ${err2.message}`);
          return res.end();
        }
      } else {
        res.statusCode = 400; // Bad Request
        res.write('Path does not exist!');
        await cleanupUploads(files.uploads);
        return res.end();
      }
    }

    // move uploaded files to target path
    let count = 0;
    for (const file of files.uploads) {
      if (!file) continue;
      const newPath = path.join(targetPath, file.originalFilename);
      try {
        await fs.rename(file.filepath, newPath);
        console.log(new Date().toUTCString(), '- File uploaded', newPath);
        count++;
      } catch (err) {
        console.log(`Error moving temporary file to target path! ${err}`);
      }
    }

    res.statusCode = 200; // OK
    res.write(count > 1 ? `${count} files uploaded!` : 'File uploaded!');
    res.end();

  } else {
    // show index page
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>http-server-upload</title>
</head>
<body>
<form action="upload" method="post" enctype="multipart/form-data" onsubmit="let totalSize=0, files=document.getElementById('fileinput').files; for (let file of files){totalSize+=file.size} if(files.length){return (totalSize<${maxFileSize})?true:(alert(\`Cannot upload. Input files \${(totalSize/1024/1024).toFixed(2)} MB exceed ${maxFileSize / 1024 / 1024} MB limit.\`),false) }else{alert('No file selected.');return false}">
  Files: <input id="fileinput" type="file" name="uploads" multiple="multiple"><br />
  Upload path: <input type="text" name="path" value=""><br />
  ${token ? 'Token: <input type="text" name="token" value=""><br />' : ''}
  <input type="submit" value="Upload!">
</form>
</body>
</html>`);
    return res.end();
  }
});

// handle listening events when the server is ready
server.on('listening', () => {
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((dev) => {
    ifaces[dev].forEach((addr) => {
      if (addr.family === 'IPv4') {
        console.log(`  http://${addr.address}:${port}/`);
      } else if (addr.family === 'IPv6') {
        console.log(`  http://[${addr.address}]:${port}/`);
      }
    });
  });

  console.log('Hit CTRL-C to stop the server');
});

// handle server errors
server.on('error', (err) => {
  if (!disableAutoPort && err.code === 'EADDRINUSE') {
    // auto port is enabled and address is in use
    // try next port
    port++;
    server.listen(port);
  } else {
    console.error(err);
  }
});

// start server listening
server.listen(port);
