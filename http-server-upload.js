/*
 * HTTP Server Upload
 *
 * Simple zero-configuration command-line http server which provides a lightweight interface to upload files.
 *
 * https://github.com/crycode-de/http-server-upload
 *
 * MIT license
 * Copyright (c) 2019-2021 Peter Müller <peter@crycode.de> https://crycode.de
 */
'use strict';

const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const os = require('os');

const port = process.env.PORT || 8080;
const uploadDir = process.env.UPLOAD_DIR || process.argv[2] || process.cwd();
const uploadTmpDir = process.env.UPLOAD_TMP_DIR || uploadDir;
const token = process.env.TOKEN || false;
const pathMatchRegExp = (process.env.PATH_REGEXP) ? new RegExp(process.env.PATH_REGEXP) : /^[a-zA-Z0-9-_/]*$/;
const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE, 10) || 200) * 1024 * 1024;

console.log('HTTP Server Upload');
console.log(`Upload target dir is ${uploadDir}`);

http.createServer((req, res) => {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    const form = new formidable.IncomingForm({
      uploadDir: uploadTmpDir,
      multiples: true,
      maxFileSize: maxFileSize
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(new Date().toUTCString(), '- Error parsing form data: ' + err.message);
        res.write('Error parsing form data! ' + err.message);
        return res.end();
      }

      if (token && fields.token !== token) {
        res.write('Wrong token!');
        return res.end();
      }

      if (!Array.isArray(files.uploads)) {
        files.uploads = [files.uploads];
      }

      if (fields.path) {
        if (!fields.path.match(pathMatchRegExp)) {
          res.write('Invalid path!');
          return res.end();
        }
      } else {
        fields.path = '';
      }

      fs.stat(path.join(uploadDir, fields.path), (err, stats) => {
        if (err) {
          res.write('Path does not exist!');
          return res.end();
        }

        files.uploads.forEach((file) => {
          if (!file) return;
          const newPath = path.join(uploadDir, fields.path, file.name);
          fs.renameSync(file.path, newPath);
          console.log(new Date().toUTCString(), '- File uploaded', newPath);
        });

        res.write('File uploaded!');
        res.end();
      });

    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="upload" method="post" enctype="multipart/form-data">');
    res.write('Files: <input type="file" name="uploads" multiple="multiple"><br />');
    res.write('Upload path: <input type="text" name="path" value=""><br />');
    if (token) {
      res.write('Token: <input type="text" name="token" value=""><br />');
    }
    res.write('<input type="submit" value="Upload!">');
    res.write('</form>');
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
