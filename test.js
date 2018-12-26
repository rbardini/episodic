/* eslint-disable no-tabs */
const stripAnsi = require('strip-ansi')
const episodic = require('./')

jest.mock('fs', () => ({
  mkdir: jest.fn((_path, _mode, cb) => cb(null)),
  readdir: jest.fn((_path, cb) =>
    cb(null, [1, 2, 3].map(i => `The.Foo.Bar.S01E0${i}.720p.HDTV.x264-WTF.mkv`))
  ),
  rename: jest.fn((_oldPath, _newPath, cb) => cb(null))
}))

jest.mock('imdb-api', () => ({
  get: jest.fn(({ name }) =>
    Promise.resolve({
      name: name.replace(/(^| )(\w)/g, s => s.toUpperCase()),
      episodes: jest.fn(() =>
        Promise.resolve(
          [1, 2, 3].map(episode => ({
            episode,
            name: `Episode #${episode}`,
            season: 1
          }))
        )
      ),
      imdburl: 'https://www.some-imdb-url.com/',
      start_year: 2018
    })
  )
}))

jest.mock('inquirer', () => ({
  prompt: jest.fn(() => Promise.resolve({ rename: true }))
}))

jest.mock('ora', () => () => ({
  start: jest.fn(() => ({
    stop: jest.fn()
  }))
}))

jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})
jest.spyOn(process, 'exit').mockImplementation(() => {})

delete process.env.OMDB_API_KEY

test('should error out if no API key is provided', async () => {
  await episodic('path/to/files')

  expect(console.error).toHaveBeenCalled()
  expect(process.exit).toHaveBeenCalledWith(1)
})

test('should rename files in-place', async () => {
  await episodic('path/to/files', { apiKey: 'omdb-api-key' })

  expect(console.log).toHaveBeenCalledTimes(1)
  expect(stripAnsi(console.log.mock.calls[0][0])).toMatchInlineSnapshot(`
"
The Foo Bar (2018)
https://www.some-imdb-url.com/

	The.Foo.Bar.S01E01.720p.HDTV.x264-WTF.mkv -> 1. Episode #1.mkv
	The.Foo.Bar.S01E02.720p.HDTV.x264-WTF.mkv -> 2. Episode #2.mkv
	The.Foo.Bar.S01E03.720p.HDTV.x264-WTF.mkv -> 3. Episode #3.mkv
"
`)
})

test('should move files to an output directory', async () => {
  await episodic('path/to/files', {
    apiKey: 'omdb-api-key',
    output: 'path/to/dest'
  })

  expect(console.log).toHaveBeenCalledTimes(1)
  expect(stripAnsi(console.log.mock.calls[0][0])).toMatchInlineSnapshot(`
"
The Foo Bar (2018)
https://www.some-imdb-url.com/

	The.Foo.Bar.S01E01.720p.HDTV.x264-WTF.mkv -> ../dest/1. Episode #1.mkv
	The.Foo.Bar.S01E02.720p.HDTV.x264-WTF.mkv -> ../dest/2. Episode #2.mkv
	The.Foo.Bar.S01E03.720p.HDTV.x264-WTF.mkv -> ../dest/3. Episode #3.mkv
"
`)
})

test('should organize files into show name/season directories', async () => {
  await episodic('path/to/files', { apiKey: 'omdb-api-key', tree: true })

  expect(console.log).toHaveBeenCalledTimes(1)
  expect(stripAnsi(console.log.mock.calls[0][0])).toMatchInlineSnapshot(`
"
The Foo Bar (2018)
https://www.some-imdb-url.com/

	The.Foo.Bar.S01E01.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/1. Episode #1.mkv
	The.Foo.Bar.S01E02.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/2. Episode #2.mkv
	The.Foo.Bar.S01E03.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/3. Episode #3.mkv
"
`)
})
