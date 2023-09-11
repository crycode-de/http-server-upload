# Changelog

## v3.0.0 (2023-09-11)

* 💥 Require Node.js >= 14.18
* 💥 Added correct http status codes for error responses
* Added option to serve a custom index html file
* Fixed false upload ok message when no file was uploaded
* Updated formidable dependency
* Refactored and optimized some code parts
* Switched to ES module style
* Added eslint checks for better code

## v2.2.2 (2023-03-01)

* Use async/await style to avoid the callback hell
* Fix folder creation issues

## v2.2.1 (2023-02-27)

* Fixed create non-existent folder on upload (by [gtricot](https://github.com/gtricot))

## v2.2.0 (2023-02-07)

* Added option to create non-existent folder on upload (by [gtricot](https://github.com/gtricot))

## v2.1.2 (2023-01-15)

* Added checks for 'no file chosen' and 'maxFileSize exceeded' on the page served (by [hmmnoice](https://github.com/hmmnoice))
* Updated dependency

## v2.1.1 (2022-09-09)

* Add support for command line arguments `--help` and `-h` to display some help text

## v2.1.0 (2022-09-04)

* Add support for command line arguments
* Automatic port increase if the requested port is already in use

## v2.0.1 (2022-08-20)

* Add viewport meta tag for better support on mobile devices (by [szanni](https://github.com/szanni))

## v2.0.0 (2022-06-20)

* Require Node.js >= 10
* Updated formidable dependency
* Delete temporary files for failed or unauthorized uploads
* Some code optimizations

## v1.1.0 (2021-09-14)

* Added max file size option
* Added display of upload errors
* Added display of IP addresses
* Updated some log messages
* Moved project to GitHub
