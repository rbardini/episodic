# episodic

[![npm package version](https://img.shields.io/npm/v/episodic.svg)](https://www.npmjs.com/package/episodic)
[![Build status](https://img.shields.io/travis/rbardini/episodic.svg)](https://travis-ci.org/rbardini/episodic)
[![Code coverage](https://img.shields.io/coveralls/rbardini/episodic.svg)](https://coveralls.io/r/rbardini/episodic)
[![Dependencies status](https://img.shields.io/david/rbardini/episodic.svg)](https://david-dm.org/rbardini/episodic)
[![devDependencies status](https://img.shields.io/david/dev/rbardini/episodic.svg)](https://david-dm.org/rbardini/episodic?type=dev)
[![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

📺 An opinionated CLI tool to automatically rename TV show releases.

![Demo](demo.gif)

Requires a valid [OMDb API key](https://www.omdbapi.com/apikey.aspx).

## Installation

```console
$ npm install -g episodic
```

## Usage

```console
$ episodic
Usage: episodic [options] <path>

Options:
  -v, --version        output the version number
  -k, --api-key <key>  specify the OMDb API key (default: OMDB_API_KEY)
  -o, --output <path>  specify the output path of renamed files
  -n, --no-tree        don't organize files into show name/season directories
  -f, --force          don't ask for confirmation before renaming files
  -h, --help           output usage information
```

## License

MIT
