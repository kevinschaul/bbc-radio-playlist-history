const fs = require('fs')
const cheerio = require('cheerio')
const got = require('got')

;(async () => {


// Array of program ids to scrape
// e.g. https://www.bbc.co.uk/programmes/b01fm4ss/
const PROGRAMS = ['b01fm4ss']

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
      album: $el.find('.segment__track li em').text(),
      recordLabel: $el.find('.segment__track abbr[title="Record Label"]').text(),
      programTitle: programTitle,
      episodeTitle: episodeTitle,
      episodeTimestamp: episodeTimestamp,
    }
  }).toArray()
  return tracks
}

/*
let data = {}
for (const program of PROGRAMS) {
  const episodes = await getEpisodes(program)
  console.log(episodes)
  for (const episode of episodes) {
    console.log(episode)
    const tracks = await getTracks(episode)
    console.log(tracks)
  }
}
*/
const tracks = await getTracks('m0019kpt')
console.log(tracks)

})()