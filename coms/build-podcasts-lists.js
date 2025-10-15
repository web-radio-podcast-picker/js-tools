// build podcasts lists (by lang, by alphabet and/or prefix)

import fs from 'fs'
import readline from 'readline'

import knownLangs from '../output/kown-langs-groups-names-referential.json' assert {type: 'json'};

export default class BuildPodcastsLists {

    langsFlatFilename = 'output/podcasts-lists-flat-langs.json'
    langsFilename = 'output/podcasts-lists-langs.json'
    listsFilename = 'output/podcasts-lists.json'

    //dbExportFilename = 'data/podcastindex_feeds.db.csv'
    //dbExportFilename = 'data/output.csv'
    dbExportFilename = 'data/output_all.csv'
    unknownLang = '?'

    separator = '📚|📚'

    state = {
        startStamp: null,
        endStamp: null,
        durStamp: null,
        rowIndex: 0,
        rowCount: 0,
        maxRows: null, //10000,
        checkSeparator: false,
        lists: {},
        langs: {}
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
        });
        reader.on('line', (line) => {
            this.processRow(line)
            // limit rows for dev
            if (this.state.maxRows != null && this.state.rowCount >= this.state.maxRows)
                reader.close()
        });
        reader.on('close', () => {
            this.endProcess()
        });
    }

    endProcess() {
        this.state.endStamp = Date.now()
        this.state.durStamp = this.state.endStamp - this.state.startStamp

        console.log(this.state.langs)
        console.log(this.state.lists)

        console.log('end of file - ' + new Date());
        console.log('duration = ' + this.state.durStamp / 1000 + ' sec')
        console.log('row count = ' + this.state.rowCount)

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
        /*
        if (this.state.rowIndex == 0)
            console.warn(row)
        */
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
        const lang = this.util.normalizeName(t[17])
        const tags = []
        for (var i = 0; i < 10; i++) {
            const c = t[29 + i]
            if (c != '""')
                tags.push(c)
        }
        var isoLang = knownLangs.map[lang]
        var det = ''
        if (isoLang === undefined) {
            isoLang = this.unknownLang
            det = ' (' + lang + ')'
        }
        //console.warn(isoLang + det + ' | ' + tags.join(','))
        this.addList(isoLang, tags, row)
        this.addLang(isoLang)
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

    addList(isoLang, tags) {
        const s = this.state
        var lst = s.lists[isoLang]
        if (!lst) {
            lst = s.lists[isoLang] = { items: [], count: 0 }
        }
        //lst.items.push(row)
        lst.count++
    }
}