import { expect, test, vi } from 'vitest'
import episodic from './index.js'

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readdir: vi.fn(() =>
    [1, 2, 3].map(i => `The.Foo.Bar.S01E0${i}.720p.HDTV.x264-WTF.mkv`),
  ),
  rename: vi.fn(),
}))

vi.mock('imdb-api', () => ({
  get: vi.fn(({ name }) =>
    Promise.resolve({
      name: name.replace(/(^| )(\w)/g, s => s.toUpperCase()),
      episodes: vi.fn(() =>
        Promise.resolve(
          [1, 2, 3].map(episode => ({
            episode,
            name: `Episode #${episode}`,
            season: 1,
          })),
        ),
      ),
      imdburl: 'https://www.some-imdb-url.com/',
      start_year: 2018,
    }),
  ),
}))

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(() => ({ rename: true })),
  },
}))

vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn(() => ({
      stop: vi.fn(),
    })),
  }),
}))

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(process, 'exit').mockImplementation(() => {})

test('should error out if no API key is provided', async () => {
  await episodic('path/to/files')

  expect(console.error).toHaveBeenCalled()
  expect(process.exit).toHaveBeenCalledWith(1)
})

test('should rename files in-place', async () => {
  await episodic('path/to/files', { apiKey: 'omdb-api-key' })

  expect(console.log).toHaveBeenCalledTimes(1)
  expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
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
    output: 'path/to/dest',
  })

  expect(console.log).toHaveBeenCalledTimes(1)
  expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
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
  expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
"
The Foo Bar (2018)
https://www.some-imdb-url.com/

	The.Foo.Bar.S01E01.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/1. Episode #1.mkv
	The.Foo.Bar.S01E02.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/2. Episode #2.mkv
	The.Foo.Bar.S01E03.720p.HDTV.x264-WTF.mkv -> The Foo Bar (2018)/Season 1/3. Episode #3.mkv
"
`)
})
