/*
 * HTTP Server Upload
 *
 * Simple zero-configuration command-line http server which provides a lightweight interface to upload files.
 *
 * https://github.com/crycode-de/http-server-upload
 *
 * MIT license
 * Copyright (c) 2019-2022 Peter Müller <peter@crycode.de> https://crycode.de
 */
'use strict';

const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const os = require('os');

let port = process.env.PORT || 8080;
let uploadDir = process.env.UPLOAD_DIR || process.cwd();
let uploadTmpDir = process.env.UPLOAD_TMP_DIR || uploadDir;
let token = process.env.TOKEN || false;
let pathMatchRegExp = (process.env.PATH_REGEXP) ? new RegExp(process.env.PATH_REGEXP) : /^[a-zA-Z0-9-_/]*$/;
let maxFileSize = (parseInt(process.env.MAX_FILE_SIZE, 10) || 200) * 1024 * 1024;

console.log('HTTP Server Upload');

// parse arguments
let uploadDirSetFromArg = false;
const myArgs = process.argv.slice(2);
while (myArgs.length > 0) {
  const arg = myArgs.shift();
  if (arg.startsWith('--')) {
    // it's an option ...

    let [key, val] = arg.split(/=(.*)/); // --dir=test=123 will give ['--dir','test=123','']

    // get value from next arg if not provided by --arg=val
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

http.createServer((req, res) => {

  if (req.url == '/upload' && req.method.toLowerCase() === 'post') {
    const form = new formidable.IncomingForm({
      uploadDir: uploadTmpDir,
      multiples: true,
      maxFileSize: maxFileSize
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(new Date().toUTCString(), `- Error parsing form data: ${err.message}`);
        res.write(`Error parsing form data! ${err.message}`);
        return res.end();
      }

      if (!Array.isArray(files.uploads)) {
        files.uploads = [files.uploads];
      }

      if (token && fields.token !== token) {
        res.write('Wrong token!');
        files.uploads.forEach((file) => file && fs.unlink(file.filepath));
        return res.end();
      }

      if (fields.path) {
        if (!fields.path.match(pathMatchRegExp)) {
          res.write('Invalid path!');
          files.uploads.forEach((file) => file && fs.unlink(file.filepath));
          return res.end();
        }
      } else {
        fields.path = '';
      }

      fs.stat(path.join(uploadDir, fields.path), (err) => {
        if (err) {
          res.write('Path does not exist!');
          files.uploads.forEach((file) => file && fs.unlink(file.filepath));
          return res.end();
        }

        let count = 0;
        files.uploads.forEach((file) => {
          if (!file) return;
          const newPath = path.join(uploadDir, fields.path, file.originalFilename);
          fs.renameSync(file.filepath, newPath);
          console.log(new Date().toUTCString(), '- File uploaded', newPath);
          count++;
        });

        res.write(count > 1 ? `${count} files uploaded!` : 'File uploaded!' );
        res.end();
      });

    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>http-server-upload</title>
</head>
<body>
<form action="upload" method="post" enctype="multipart/form-data">
  Files: <input type="file" name="uploads" multiple="multiple"><br />
  Upload path: <input type="text" name="path" value=""><br />
  ${token ? 'Token: <input type="text" name="token" value=""><br />' : ''}
  <input type="submit" value="Upload!">
</form>
</body>
</html>`);
    return res.end();
  }
}).listen(port, () => {
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
