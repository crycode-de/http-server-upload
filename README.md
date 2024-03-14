# http-server-upload

[![NPM version](https://img.shields.io/npm/v/http-server-upload.svg)](https://www.npmjs.com/package/http-server-upload)
[![Downloads](https://img.shields.io/npm/dm/http-server-upload.svg)](https://www.npmjs.com/package/http-server-upload)

[![NPM](https://nodei.co/npm/http-server-upload.png?downloads=true)](https://nodei.co/npm/http-server-upload/)

This is a simple zero-configuration command-line http server which provides a lightweight interface to upload files.

By default files are uploaded to the current working directory.

Optionally a token may be used to protect against unauthorized uploads.

## Installation

Version 3 of `http-server-upload` requires Node.js 14.18 or higher.

```sh
npm install --global http-server-upload
```

This will install `http-server-upload` globally so that it may be run from the command line.

## Usage

```sh
http-server-upload [arguments] [uploadRootPath]
```

`[uploadRootPath]` defaults to the current working directory (`./`).

Other options can be set using environment variables.

When the server is running you can visit http://localhost:8080/ to get the upload form.

If the desired port is already in use, the port will be increased automatically
until the next free port is found. This can be disabled, see below.

*Attention:* Already existing files will be overwritten on upload.

### Docker mode

You can just build a container image from this repository.

```sh
docker build -t http-server-upload .
```

Then run it without argument for default

```sh
docker run --rm -ti http-server-upload
```

Or you can override default values with environment variables (see blow for available variables).
`UPLOAD_DIR` and `UPLOAD_TMP_DIR` are set to `/upload`. You may find it useful to mount a volume in this directory to keep uploaded files. Keep in mind that this volume must be writeable by the `node` user. More complete example.

```sh
docker run --rm -ti -e PORT=9090 -e UPLOAD_DIR=/data -v myvolume:/data -p 80:9090 http-server-upload
```

### Arguments and environment variables

The optional configuration is done by command line arguments or environment variables.  
If both are used, the arguments have higher priority and the value from the
corresponding environment variable will be ignored.

| Argument | Variable | Description | Default |
|---|---|---|---|
| `--port` | `PORT` | The port to use. | `8080` |
| `--upload-dir` | `UPLOAD_DIR` | The directory where the files should be uploaded to. This overrides the `uploadRootPath` argument. | `uploadRootPath` argument or the current working directory |
| `--upload-tmp-dir` | `UPLOAD_TMP_DIR` | Temp directory for the file upload. | The upload directory. |
| `--max-file-size` | `MAX_FILE_SIZE` | The maximum allowed file size for uploads in Megabyte. | `200` |
| `--token` | `TOKEN` | An optional token which must be provided on upload. | Nothing |
| `--path-regexp` | `PATH_REGEXP` | A regular expression to verify a given upload path. This should be set with care, because it may allow write access to outside the upload directory. | `/^[a-zA-Z0-9-_/]*$/` |
| `--disable-auto-port` | `DISABLE_AUTO_PORT` | Disable automatic port increase if the port is nor available. | Not set. |
| `--enable-folder-creation` | `ENABLE_FOLDER_CREATION` | Enable automatic folder creation when uploading file to non-existent folder. | Not set. |
| `--index-file` | `INDEX_FILE` | Use a custom html file as index instead of the default internal index. If used, the form fields need to have the same names as in the original index. | Not set. |
| `--help`, `-h` | | Show some help text | |

Examples:

```sh
PORT=9000 UPLOAD_DIR=~/uploads/ UPLOAD_TMP_DIR=/tmp/ TOKEN=my-super-secret-token http-server-upload

http-server-upload --port=9000 --upload-dir="c:\users\peter\Path With Whitespaces\"

PORT=9000 http-server-upload --disable-auto-port --enable-folder-creation ./
```

### Uploads from the command line

If the `http-server-upload` is running, you may also upload files from the command line using `curl`:

```sh
curl -F "uploads=@my-file.txt" http://localhost:8080/upload
```

Advanced example with multiple files, an upload path and a required token:

```sh
curl \
  -F "uploads=@my-file.txt" \
  -F "uploads=@my-other-file.txt" \
  -F "path=my/dir" \
  -F "token=my-super-secret-token" \
  http://localhost:8080/upload
```

Example for uploading content from a pipe:

```sh
cat my-file.dat \
  | curl -F "uploads=@-;filename=my-file.dat;type=application/octet-stream" \
  http://localhost:8080/upload
```

Notice the required `filename` and `type` defintions for uploading piped data.  
The `type` is the mime type of the data to upload.

## License

MIT license

Copyright (c) 2019-2023 Peter Müller <peter@crycode.de> <https://crycode.de>
