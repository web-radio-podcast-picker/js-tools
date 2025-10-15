// js-tools CLI
console.clear()

import chalk from 'chalk'

import ParseGenLangs from './coms/parse-gen-langs.js'
const langs = (await import('./data/db-podcast-export-languages.js')).default
import isoLangs from './data/iso-639-2.json' assert {type: 'json'};
const langTrs = (await import('./data/langsTranslations.js')).default

console.log('loaded: db-podcast-export-languages')
console.log('langs count: ' + langs.length)
console.log('loaded: ISO-639-2. langs count:' + Object.keys(isoLangs).length)
console.log('langs translations: ' + Object.getOwnPropertyNames(langTrs).length)

/*
const low = await import('lowdb')
const FileSync = await import('lowdb/adapters/FileSync')
console.log(FileSync)import langTrs from './data/langsTranslations';

const adapter = new FileSync('./data/iso-639-2.json')
const iso6392 = low(adapter)
*/


const args = process.argv
const commands = ['parse-gen-langs']

const usage = function () {
  const usageText = `
  js-tools helps you manage the wrpp datas sets

  usage:
    main <command>

    commands can be:

    parse-gen-langs :      db-podcast-export-languages -> ...
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
if (!commands.includes(com)) {
  console.error('unknown command: ' + com)
  usage()
}

// run command
switch (com) {
  case 'parse-gen-langs':
    const parseGenLangs = new ParseGenLangs()
    parseGenLangs.run(langs, langTrs, isoLangs)
    break
}
