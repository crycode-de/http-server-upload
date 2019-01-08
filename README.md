# http-server-upload

This is a simple zero-configuration command-line http server which provides a lightweight interface to upload files.

By default files are uploaded to the current working directory.

Optionally a token may be used to protect against unauthorized uploads.


## Installation

```
npm install --global http-server-upload
```

This will install `http-server-upload` globally so that it may be tun from the command line.


## Usage

```
http-server-upload [uploadRootPath]
```

`[uploadRootPath]` defaults to the current working directory (`./`).

Other options can be set using environment variables.

When the server is running you can visit http://localhost:8080/ to get the upload form.

*Attention:* Already existing files will be overwritten on upload.


### Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | The port to use. | `8080` |
| `UPLOAD_DIR` | The directory where the files should be uploaded to. This overrides the `uploadRootPath` argument. | `uploadRootPath` argument or the current working directory |
| `UPLOAD_TMP_DIR` | Temp directory for the file upload. | The upload directory. |
| `TOKEN` | An optional token which must be provided on upload. | Nothing |
| `PATH_REGEXP` | A regular expression to verify a given upload path. This should be set with care, because it may allow write access to outside the upload directory. | `/^[a-zA-Z0-9-_/]*$/` |

Example:
```
PORT=9000 UPLOAD_DIR=~/uploads/ UPLOAD_TMP_DIR=/tmp/ TOKEN=my-super-secret-token http-server-upload
```


### Uploads from the command line

If the `http-server-upload` is running, you may also upload files from the command line using `curl`:
```
curl -F "uploads=@my-file.txt" http://localhost:8080/upload
```

Advanced example with multiple files, an upload path and a required token:
```
curl \
  -F "uploads=@my-file.txt" \
  -F "uploads=@my-other-file.txt" \
  -F "path=my/dir" \
  -F "token=my-super-secret-token" \
  http://localhost:8080/upload
```


## License

MIT license

Copyright (c) 2019 Peter Müller <peter@crycode.de> https://crycode.de
