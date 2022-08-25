const fs = require('fs');
const cheerio = require('cheerio');
const got = require('got');
const csv = require('csv');
const { isEqual, uniqWith, sortBy } = require('lodash');

(async () => {

// Array of program ids to scrape
// e.g. https://www.bbc.co.uk/programmes/b01fm4ss/
const PROGRAMS = ['b01fm4ss']
const FILENAME = 'history.csv'

const getEpisodes = async (programID) => {
  const url = `https://www.bbc.co.uk/programmes/${programID}/episodes/player`
  const { body } = await got.get(url)
  const $ = cheerio.load(body)

  const episodeLinks = $('.programme__body a')
  const hrefs = episodeLinks.map((i, el) => {
    return $(el).attr('href')
  }).toArray()

  const episodeIDs = hrefs.map(d => d.split('/').pop())
  return episodeIDs
}

const getTracks = async (episodeID) => {
  const url = `https://www.bbc.co.uk/programmes/${episodeID}`
  const { body } = await got.get(url)
  const $ = cheerio.load(body)

  const programTitle = $('.br-masthead__title a').text()
  const episodeTitle = $('h1').text()
  const episodeTimestamp = $('.broadcast-event__time').attr('content')

  const trackItems = $('#segments li.segments-list__item--music')
  const tracks = trackItems.map((i, el) => {
    const $el = $(el)

    return {
      artist: $el.find('.segment__track .artist').text(),
      title: $el.find('.segment__track p.no-margin span').text(),
      album: $el.find('.segment__track li em').text().replace(/\. $/, ''),
      recordLabel: $el.find('.segment__track abbr[title="Record Label"]').text().replace(/\. $/, ''),
      sequence: i,
      programTitle: programTitle,
      episodeTitle: episodeTitle,
      episodeTimestamp: episodeTimestamp,
    }
  }).toArray()
  return tracks
}

let data = []
for (const program of PROGRAMS) {
  const episodes = await getEpisodes(program)
  for (const episode of episodes) {
    const tracks = await getTracks(episode)
    data = data.concat(tracks)
  }
}

let previousData = []
try {
  const file = fs.readFileSync(FILENAME, 'utf-8')
  previousData = await new Promise((resolve, reject) => {
    csv.parse(file, { columns: true, cast: true }, (e, d) => {
      resolve(d)
    })
  })
} catch(e) {
}

const combined = uniqWith(data.concat(previousData), isEqual)

const sorted = sortBy(combined, [
  d => -d.episodeTimestamp,
  d => d.sequence
])

const csvString = await new Promise((resolve, reject) => {
  csv.stringify(sorted, { header: true }, function(e, d) {
    resolve(d)
  })
})
fs.writeFileSync(FILENAME, csvString)

})()

