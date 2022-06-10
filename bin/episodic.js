#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { program } from 'commander'
import episodic from '../index.js'

const { version } = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url)),
)

program
  .version(version, '-v, --version')
  .usage('[options] <path>')
  .option(
    '-k, --api-key <key>',
    'specify the OMDb API key (default: OMDB_API_KEY)',
  )
  .option('-o, --output <path>', 'specify the output path of renamed files')
  .option(
    '-n, --no-tree',
    "don't organize files into show name/season directories",
  )
  .option('-f, --force', "don't ask for confirmation before renaming files")
  .parse(process.argv)

const [source] = program.args

if (source) {
  episodic(source, program.opts())
} else {
  program.help()
}
