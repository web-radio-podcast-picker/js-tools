// js-tools CLI

console.clear()

import chalk from 'chalk'

import ParseGenLangs from './coms/parse-gen-langs.js'
const langs = (await import('./input/db-podcast-export-languages.js')).default
import isoLangs from './input/iso-639-2.json' assert {type: 'json'}
const langTrs = (await import('./input/langsTranslations.js')).default
import Util from './util.js'

import BuildPodcastsLists from './coms/build-podcasts-lists.js'
import BuildUnicodeMap from './coms/build-unicode-map.js';

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

    parse-gen-langs :      input/db-podcast-export-languages.js
                            -->
                               output/unknown-langs.json
                               output/known-langs.json
                               output/unkown-langs-groups-names-referential.json
                               output/kown-langs-groups-names-referential.json

    build-podcasts-lists [--build-splits] :
        
                            input/podcastindex_feeds.db.csv
                            output/known-langs.json
                            output/unkown-langs-groups-names-referential.json
                            output/kown-langs-groups-names-referential.json
                             -->
                              output/podcasts-lists.json
                              output/podcasts-lists-lang.json
                              output/podcasts-lists-flat-langs.json
                              
    build-unicode-map :     input/ucd.all.grouped.xml
                              -->
                                output/unicode-map.json
  `
  console.log(usageText)
  process.exit(0)
}

// checks args
if (args.length < 3) {
  console.error('com argument required')
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
    var opts = null
    if (args.length == 4)
      opts = args[4]
    const buildPodcastsLists = new BuildPodcastsLists()
    buildPodcastsLists.run(opts, langs, langTrs, isoLangs, new Util())
    break
  case 'build-unicode-map':
    const buildUnicodeMap = new BuildUnicodeMap()
    buildUnicodeMap.run(new Util())
    break
  default:
    console.error('unknown command: ' + com)
    usage()
    break
}
