// js-tools CLI
console.clear()

import chalk from 'chalk'

import ParseGenLangs from './coms/parse-gen-langs.js'
const langs = (await import('./data/db-podcast-export-languages.js')).default
import isoLangs from './data/iso-639-2.json' assert {type: 'json'}
import BuildPodcastsLists from './coms/build-podcasts-lists.js'
const langTrs = (await import('./data/langsTranslations.js')).default
import Util from './util.js'

console.log('loaded: db-podcast-export-languages')
console.log('langs count: ' + langs.length)
console.log('loaded: ISO-639-2. langs count:' + Object.keys(isoLangs).length)
console.log('langs translations: ' + Object.getOwnPropertyNames(langTrs).length)

const args = process.argv

const usage = function () {
  const usageText = `
  js-tools helps you manage the wrpp datas sets

  usage:
    main <command>

    commands can be:

    parse-gen-langs :      db-podcast-export-languages.js
                            -->
                               output/unknown-langs.json
                               output/known-langs.json
                               output/unkown-langs-groups-names-referential.json
                               output/kown-langs-groups-names-referential.json

    build-podcasts-lists:   podcastindex_feeds.db.csv
                            output/known-langs.json
                            output/unkown-langs-groups-names-referential.json
                            output/kown-langs-groups-names-referential.json
                             -->
                              ...
  `
  console.log(usageText)
  process.exit(0)
}

// checks args
if (args.length != 3) {
  console.error('only one argument can be accepted. 1 argument required')
  usage()
}
const com = args[2]

// run command
switch (com) {
  case 'parse-gen-langs':
    const parseGenLangs = new ParseGenLangs()
    parseGenLangs.run(langs, langTrs, isoLangs, new Util())
    break
  case 'build-podcasts-lists':
    const buildPodcastsLists = new BuildPodcastsLists()
    buildPodcastsLists.run(langs, langTrs, isoLangs, new Util())
    break
  default:
    console.error('unknown command: ' + com)
    usage()
    break
}
