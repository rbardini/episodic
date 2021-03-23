const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const groupBy = require('lodash.groupby')
const imdb = require('imdb-api')
const inquirer = require('inquirer')
const ora = require('ora')
const parseVideoName = require('video-name-parser')

const renameFiles = configs =>
  configs.map(
    ({ sourceName, sourcePath, targetName, targetPath }) =>
      new Promise((resolve, reject) => {
        const oldPath = path.join(sourcePath, sourceName)
        const newPath = path.join(targetPath, targetName)

        fs.mkdir(path.dirname(newPath), { recursive: true }, err => {
          if (err) return reject(err)

          fs.rename(oldPath, newPath, err => {
            if (err) return reject(err)

            resolve()
          })
        })
      }),
  )

module.exports = async (source, options = {}) => {
  const { apiKey = process.env.OMDB_API_KEY, force, output, tree } = options
  const sourcePath = path.resolve(source)
  const targetPath = output ? path.resolve(output) : sourcePath

  if (apiKey == null) {
    console.error(
      chalk.red(
        [
          'No API key found.',
          'Please specify a valid OMDb API key with the `--api-key` option or `OMDB_API_KEY` environment variable.',
          `You can get one at ${chalk.blue.underline(
            'https://www.omdbapi.com/apikey.aspx',
          )}. See \`--help\` for more information.`,
        ].join('\n'),
      ),
    )
    return process.exit(1)
  }

  const spinner = ora('Reading files').start()

  await fs.readdir(sourcePath, async (err, filenames) => {
    if (err) throw err

    const metadataMap = groupBy(
      filenames
        .map(filename => ({
          ...parseVideoName(filename),
          filename,
          extension: path.extname(filename),
        }))
        .filter(({ type }) => type === 'series'),
      'name',
    )

    spinner.text = 'Fetching data'

    const promises = Object.keys(metadataMap).map(async name => {
      let tvShow, episodes

      try {
        tvShow = await imdb.get({ name }, { apiKey })
        episodes = await tvShow.episodes()
      } catch (err) {
        return
      }

      const episodeMap = groupBy(episodes, 'season')

      const configs = metadataMap[name]
        .map(metadata => {
          const season = episodeMap[metadata.season] || []
          const episodes = season
            .filter(({ episode }) => metadata.episode.includes(episode))
            .sort((a, b) => a.episode - b.episode)

          if (episodes.length !== metadata.episode.length) return undefined

          const episode = episodes.map(({ episode }) => episode).join('-')
          const name = episodes.map(({ name }) => name).join(' | ')

          const sourceName = metadata.filename
          const targetName = path.join(
            tree
              ? `${tvShow.name} (${tvShow.start_year})/Season ${metadata.season}`
              : '',
            `${episode}. ${name}${metadata.extension}`,
          )

          return {
            sourceName,
            sourcePath,
            targetName,
            targetPath,
          }
        })
        .filter(Boolean)

      return { configs, tvShow }
    })

    const results = (await Promise.all(promises)).filter(Boolean)
    spinner.stop()

    for (const result of results) {
      const { configs, tvShow } = result
      const changes = configs.reduce(
        (acc, { sourceName, sourcePath, targetName, targetPath }) =>
          `${acc}\t${chalk.green(
            `${sourceName} -> ${path.relative(
              sourcePath,
              path.join(targetPath, targetName),
            )}`,
          )}\n`,
        `\n${chalk.bold(
          `${tvShow.name} (${tvShow.start_year})`,
        )}\n${chalk.blue.underline(tvShow.imdburl)}\n\n`,
      )

      let confirmed = false

      if (!force) {
        console.log(changes)
        const { rename } = await inquirer.prompt({
          type: 'confirm',
          name: 'rename',
          message: 'Rename files?',
          default: true,
        })
        confirmed = rename
      }

      if (force || confirmed) {
        await Promise.all(renameFiles(configs))
      }
    }
  })
}
