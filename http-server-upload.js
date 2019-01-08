/* jshint node:true, esversion:6 */
'use strict';

const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const uploadDir = process.env.UPLOAD_DIR || process.argv[2] || process.cwd();
const uploadTmpDir = process.env.UPLOAD_TMP_DIR || uploadDir;
const token = process.env.TOKEN || false;
const pathMatchRegExp = (process.env.PATH_REGEXP) ? new RegExp(process.env.PATH_REGEXP) : /^[a-zA-Z0-9-_/]*$/;

http.createServer(function (req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    const form = new formidable.IncomingForm({
      uploadDir: uploadTmpDir,
      multiples: true
    });

    form.parse(req, function (err, fields, files) {
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
          console.log(new Date().toUTCString(), '- file uploaded', newPath);
        });

        res.write('file uploaded!');
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
  console.log(`http server listening on port ${port}`);
  console.log('upload target dir is', uploadDir);
});
