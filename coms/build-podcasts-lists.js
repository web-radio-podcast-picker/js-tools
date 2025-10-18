// build podcasts lists (by lang, by alphabet and/or prefix)

// podcasts --> by lang --> by tag  --> by  alphabet
// output lists:    lang-tag-alph.csv

import fs from 'fs'
import readline from 'readline'

import unicodeMap from '../output/unicode-map.json' assert {type: 'json'}
import knownLangs from '../output/kown-langs-groups-names-referential.json' assert {type: 'json'}
import { c_title, c_host, c_itunesAuthor, c_category1, c_language } from '../podcast-db-consts.js'

export default class BuildPodcastsLists {

    buildSplits = false

    langsFlatFilename = 'output/podcasts-lists-flat-langs.json'
    langsFilename = 'output/podcasts-lists-langs.json'
    listsFilename = 'output/podcasts-lists.json'
    outputListsPath = 'output/lists/'

    //dbExportFilename = 'input/podcastindex_feeds.db.csv'
    //dbExportFilename = 'input/output.csv'
    dbExportFilename = 'input/output_all.csv'
    unknownLang = '?'
    maxListCountBeforeAlphabeticalSlice = 100
    traceNonLetterFirstTitleChar = false
    substSpecialCharacter = '*'
    dumpFirstCharFallback = false
    dumpLists = false
    titleRemoveFirstChars = ['#', '.', ':', '*', '-', '@', '»', '&', '|', '©', '=',
        '®', '_'
    ]
    // TODO: add symbols { }
    skipSymbols = ['’', '‘', '«', '“', '”', '"', "'", '《', '[', '[', '「', '¡', '(', '¿', '®',
        '$', '+', '/', '｜', '"', '【', '〈', '〉', '】', ']', ')', ' ', '•', '.', '<', '>', '‌',
        '!', '~', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ]
    // TODO: check why see this � instead of emoji ? == response: it's due to surrogate for UTF16 (non readable UTF8)

    letters = []

    separator = '📚|📚'

    state = {
        startStamp: null,
        endStamp: null,
        durStamp: null,
        rowIndex: 0,
        rowCount: 0,
        addedRowCount: 0,
        maxRows: null,//1000,
        checkSeparator: false,
        lists: {},
        langs: {},
        noNameCount: 0,
        titlesWithNonLetterChar: 0
    }

    run(opts, langs, langTrs, isoLangs, util) {
        if (opts != null) {
            if (opts == '--build-splits')
                this.buildSplits = true
            else {
                console.error('invalid argument: ' + opts)
                return
            }
        }
        this.util = util
        this.langs = langs
        this.langTrs = langTrs
        this.isoLangs = isoLangs
        this.parseDbExportPass1()
    }

    parseDbExportPass1() {
        this.state.startStamp = Date.now()
        const begin = new Date()
        console.log('parse db export [PASS 1] - ' + begin)
        if (this.buildSplits)
            console.warn('BUILD SPLIT ENABLED')
        else
            console.warn('build split disabled')
        const fileStream = fs.createReadStream(this.dbExportFilename)
        const reader = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })
        reader.on('line', (line) => {
            this.processRow(line, 1)
            // limit rows for dev
            if (this.state.maxRows != null && this.state.rowCount >= this.state.maxRows)
                reader.close()
        })
        reader.on('close', () => {
            fileStream.close()
            reader.removeAllListeners()
            this.postPass1()
        })
    }

    postPass1() {

        this.arrangeLists()

        if (this.dumpLists)
            this.dumpLists()

        if (this.buildSplits)
            this.parseDbExportPass2()
        else {
            console.warn('SKIP BUILD SPLITS')
            this.endProcess()
        }
    }

    parseDbExportPass2() {
        console.log('parse db export [PASS 2]')

        this.util.deleteAllFilesSync(this.outputListsPath)

        this.state.rowIndex = this.state.rowCount = 0
        const fileStream = fs.createReadStream(this.dbExportFilename)
        const reader = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })
        reader.on('line', (line) => {
            this.processRow(line, 2)
            // limit rows for dev
            if (this.state.maxRows != null && this.state.rowCount >= this.state.maxRows)
                reader.close()
        })
        reader.on('close', () => {
            fileStream.close()
            reader.removeAllListeners()
            this.endProcess()
        })
    }

    arrangeLists() {
        console.log('arrange lists')
        const lists = this.state.lists
        const sep = '-'
        for (const lang in lists) {
            const byTag = lists[lang].byTag
            for (const tag in byTag) {
                const cat = byTag[tag]
                const byTagCount = cat.count
                if (byTagCount <= this.maxListCountBeforeAlphabeticalSlice) {
                    cat.items = []
                    for (const alpha in cat.byAlph) {
                        const lst = cat.byAlph[alpha].items
                        lst.forEach(x => {
                            cat.items.push(x)
                        })
                    }
                    //    delete byTag[tag].byAlph
                    byTag[tag].byAlph = {}
                }
            }
        }
    }

    dumpLists() {
        const lists = this.state.lists
        const sep = '-'
        for (const lang in lists) {
            const byTag = lists[lang].byTag
            console.log('----------- ' + lang + ' ----------- : ' + lists[lang].count)
            console.log('tags: ' + Object.getOwnPropertyNames(byTag).length)
            for (const tag in byTag) {
                const byAlph = byTag[tag].byAlph
                console.log('## ' + lang + ' : ' + tag + ' ## : ' + byTag[tag].count)
                const alphasN = Object.getOwnPropertyNames(byAlph).length
                if (alphasN > 0) {
                    console.log('## alphas: ' + Object.getOwnPropertyNames(byAlph))
                    for (const alpha in byAlph) {
                        const n = byAlph[alpha].count
                        const fn = lang + sep + tag + sep + alpha + ' : ' + n
                        console.warn(fn)
                    }
                }
                else
                    console.warn(lang + sep + tag)
            }
        }
    }

    endProcess() {
        this.state.endStamp = Date.now()
        this.state.durStamp = this.state.endStamp - this.state.startStamp

        //console.log(this.state.langs)
        //console.log(this.state.lists)

        console.log('end of file - ' + new Date());
        console.log('duration = ' + this.state.durStamp / 1000 + ' sec')
        console.log('row count = ' + this.state.rowCount)
        console.log('added row count = ' + this.state.addedRowCount)
        console.log('no name count = ' + this.state.noNameCount)
        //console.log('titles with non letter char = ' + this.state.titlesWithNonLetterChar)

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

    processRow(row, pass) {
        if (this.state.rowIndex == 0) {
            // skip header
            this.state.rowIndex++
            return
        }
        this.parseRow(row, pass)
        this.state.rowCount++
        this.state.rowIndex++
    }

    parseRow(row, pass) {
        // lookup for a valid separator
        if (pass == 1 && this.state.checkSeparator
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
            if (!name) {
                this.state.noNameCount++
            }
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
        if (isoLang === undefined) {
            isoLang = this.unknownLang
        }

        if (pass == 1 && name) {
            this.addList(isoLang, tags, name, row)
            this.addLang(isoLang)
        }

        if (pass == 2 && name) {
            this.saveToListFile(row, isoLang, tags, name)
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

    saveToListFile(row, isoLang, tags, name) {
        const sep = '-'
        const s = this.state
        // lang
        var lst = s.lists[isoLang]
        const letter1 = this.getFirstLetter(name, unicodeMap, this.skipSymbols)

        tags.forEach(tag => {
            var tagList = lst.byTag[tag]
            var filename = isoLang + sep + tag

            if (Object.getOwnPropertyNames(tagList.byAlph).length > 0) {
                // with byAlph
                filename += sep + letter1
            }
            const hex = Buffer.from(filename, 'utf8').toString('hex')
            //originalText = Buffer.from(hexString, 'hex').toString('utf8')

            //console.log(filename)
            filename = this.outputListsPath + hex + '.txt'
            if (!fs.existsSync(filename))
                fs.writeFileSync(filename, row + '\n', 'utf8')
            else
                fs.appendFileSync(filename, row + '\n', 'utf8')
        })
    }

    addList(isoLang, tags, name, row) {
        const s = this.state

        // lang groups
        var lst = s.lists[isoLang]
        if (!lst) {
            lst = s.lists[isoLang] = { byTag: {}, count: 0 }
        }

        //lst.items.push(row)   // don't keep that in memory :)

        const letter1 = this.getFirstLetter(name, unicodeMap, this.skipSymbols)

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
            if (!tlst.byAlph) {
                console.error('no by alpha - tag = ' + tag)
                console.log(tlst)
            }
            var aLst = tlst.byAlph[letter1]
            if (!aLst) {
                aLst = tlst.byAlph[letter1] = { count: 0 /*, items: []*/ }
            }
            aLst.count++
            //aLst.items.push(name)     // JavaScript heap out of memory
        })
        lst.count++
        this.state.addedRowCount++
    }

    getFirstLetter(name, unicodeMap, skipSymbols, pass) {
        const isL = this.util.getFirstLetter(name, unicodeMap, skipSymbols)
        var letter1 = isL.letter
        letter1 = letter1.toUpperCase()

        if (!isL.grp) {
            // no letter found
            if (pass == 1) {
                this.state.titlesWithNonLetterChar++
                if (this.dumpFirstCharFallback) {
                    isL.char0 = name[0]
                    console.error(isL)
                }
            }
            letter1 = this.substSpecialCharacter
        }
        return letter1
    }
}