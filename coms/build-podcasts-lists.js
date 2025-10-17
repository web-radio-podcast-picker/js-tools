// build podcasts lists (by lang, by alphabet and/or prefix)

// podcasts --> by lang --> by tag  --> by  alphabet

import fs from 'fs'
import readline from 'readline'

import unicodeMap from '../output/unicode-map.json' assert {type: 'json'}
import knownLangs from '../output/kown-langs-groups-names-referential.json' assert {type: 'json'}
import { c_title, c_host, c_itunesAuthor, c_category1, c_language } from '../podcast-db-consts.js'

export default class BuildPodcastsLists {

    langsFlatFilename = 'output/podcasts-lists-flat-langs.json'
    langsFilename = 'output/podcasts-lists-langs.json'
    listsFilename = 'output/podcasts-lists.json'

    //dbExportFilename = 'data/podcastindex_feeds.db.csv'
    //dbExportFilename = 'data/output.csv'
    dbExportFilename = 'data/output_all.csv'
    unknownLang = '?'
    maxListCountBeforeAlphabeticalSlice = 100
    traceNonLetterFirstTitleChar = false
    substSpecialCharacter = '*'
    dumpFirstCharFallback = false
    titleRemoveFirstChars = ['#', '.', ':', '*', '-', '@', '»', '&', '|', '©', '=',
        '®', '_'
    ]
    skipSymbols = ['’', '‘', '«', '“', '”', '"', "'", '《', '[', '[', '「', '¡', '(', '¿', '®',
        '$', '+', '/', '｜', '"', '【', '〈', '〉', '】', ']', ')', ' ', '•', '.', '<', '>', '‌',
        '!', '~', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ]
    // TODO: check why see this � instead of emoji ?

    letters = []

    separator = '📚|📚'

    state = {
        startStamp: null,
        endStamp: null,
        durStamp: null,
        rowIndex: 0,
        rowCount: 0,
        maxRows: null,//50000,
        checkSeparator: false,
        lists: {},
        langs: {},
        noNameCount: 0,
        titlesWithNonLetterChar: 0
    }

    run(langs, langTrs, isoLangs, util) {
        console.log('> run')
        this.util = util
        this.langs = langs
        this.langTrs = langTrs
        this.isoLangs = isoLangs
        this.parseDbExport()
    }

    parseDbExport() {
        this.state.startStamp = Date.now()
        const begin = new Date()
        console.log('parse db export - ' + begin)
        const fileStream = fs.createReadStream(this.dbExportFilename)
        const reader = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })
        reader.on('line', (line) => {
            this.processRow(line)
            // limit rows for dev
            if (this.state.maxRows != null && this.state.rowCount >= this.state.maxRows)
                reader.close()
        })
        reader.on('close', () => {
            this.postProcess()
        })
    }

    postProcess() {

        this.endProcess()
    }

    endProcess() {
        this.state.endStamp = Date.now()
        this.state.durStamp = this.state.endStamp - this.state.startStamp

        //console.log(this.state.langs)
        //console.log(this.state.lists)

        console.log('end of file - ' + new Date());
        console.log('duration = ' + this.state.durStamp / 1000 + ' sec')
        console.log('row count = ' + this.state.rowCount)
        console.log('no name count = ' + this.state.noNameCount)
        console.log('titles with non letter char = ' + this.state.titlesWithNonLetterChar)

        // store results in /out
        fs.writeFile(
            this.langsFlatFilename,
            JSON.stringify(
                this.getListFlatLang(this.state.langs), null, 2),
            err => this.util.writeFileCB(err, this.langsFilename)
        )
        fs.writeFile(
            this.langsFilename,
            JSON.stringify(this.state.langs, null, 2),
            err => this.util.writeFileCB(err, this.langsFlatFilename)
        )
        fs.writeFile(
            this.listsFilename,
            JSON.stringify(this.state.lists, null, 2),
            err => this.util.writeFileCB(err, this.listsFilename)
        )
    }

    getListFlatLang() {
        const t = {}
        var k = []
        for (var ln in this.state.langs) {
            const o = this.state.langs[ln]
            // take the first lang variant
            k.push({ name: o[0], code: ln })
        }
        // sort langs
        k = k.sort((a, b) => a.name.localeCompare(b.name))
        // associate counts
        k.forEach(o => {
            //console.warn(ln)
            t[o.name] = { code: o.code, count: this.state.lists[o.code].count }
        })
        return t
    }

    processRow(row) {
        if (this.state.rowIndex == 0) {
            // skip header
            this.state.rowIndex++
            return
        }
        this.parseRow(row)
        this.state.rowCount++
        this.state.rowIndex++
    }

    parseRow(row) {
        // lookup for a valid separator
        if (this.state.checkSeparator
            && row.includes(this.separator))
            console.warn(row)

        const t = row.split(this.separator)
        // name
        const auth = this.util.assureIsUnquoted(t[c_itunesAuthor])
        const host = this.util.assureIsUnquoted(t[c_host])
        var name = this.util.assureIsUnquoted(t[c_title])

        if (!name) {
            //console.error('--> auth=' + auth + ' host=' + host)
            name ||= auth || host
            this.state.noNameCount++
        }
        name = this.util.normalizeTitle(name, this.titleRemoveFirstChars, row)

        // lang
        const lang = this.util.normalizeName(t[c_language])
        // tags
        const tags = []
        for (var i = 0; i < 10; i++) {
            const c = t[c_category1 + i]
            if (c != '""' && c != '')
                tags.push(this.util.assureIsUnquoted(c))
        }
        // iso lang
        var isoLang = knownLangs.map[lang]
        var det = ''
        if (isoLang === undefined) {
            isoLang = this.unknownLang
            det = ' (' + lang + ')'
        }
        //console.warn(isoLang + det + ' | ' + tags.join(','))

        if (name) {
            this.addList(isoLang, tags, name, row)
            this.addLang(isoLang)
        }
    }

    addLang(isoLang) {
        const s = this.state
        var lng = s.langs[isoLang]
        if (lng === undefined) {
            //console.warn(isoLang)
            if (isoLang === this.unknownLang)
                s.langs[isoLang] = [this.unknownLang]
            else
                s.langs[isoLang] = this.isoLangs[isoLang].en
        }
    }

    addList(isoLang, tags, name, row) {
        const s = this.state

        // lang groups
        var lst = s.lists[isoLang]
        if (!lst) {
            lst = s.lists[isoLang] = { byTag: {}, count: 0 }
        }

        //lst.items.push(row)   // don't keep that in memory :)
        const isL = this.util.getFirstLetter(name, unicodeMap, this.skipSymbols)
        var letter1 = isL.letter
        letter1 = letter1.toUpperCase()

        if (!isL.grp) {
            // no letter found
            this.state.titlesWithNonLetterChar++
            if (this.dumpFirstCharFallback) {
                isL.char0 = name[0]
                console.error(isL)
            }
            letter1 = this.substSpecialCharacter
        }

        if (!this.letters.includes(letter1)) {
            this.letters.push(letter1)
        }
        /*if (isL.letter == '1') {
            console.log(isL)
            console.error(name)
        }*/

        // tags groups
        tags.forEach(tag => {
            var tlst = lst.byTag[tag]
            if (!tlst) {
                tlst = lst.byTag[tag] = { count: 0, byAlph: {} }
            }
            tlst.count++

            // alphabet groups
            var aLst = tlst.byAlph[letter1]
            if (!aLst) {
                aLst = tlst.byAlph[letter1] = { count: 0 }
            }
            aLst.count++
        })
        lst.count++
    }
}