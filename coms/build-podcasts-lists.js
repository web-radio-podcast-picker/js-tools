// build podcasts lists (by lang, by alphabet and/or prefix)

import fs from 'fs'
import readline from 'readline'

export default class BuildPodcastsLists {

    //dbExportFilename = 'data/podcastindex_feeds.db.csv'
    dbExportFilename = 'data/output.csv'

    separator = '📚|📚'

    state = {
        startStamp: null,
        endStamp: null,
        durStamp: null,
        rowIndex: 0,
        rowCount: 0,
        maxRows: null,
        checkSeparator: false
    }

    run(langs, langTrs, isoLangs) {
        console.log('> run')
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
            this.state.endStamp = Date.now()
            this.state.durStamp = this.state.endStamp - this.state.startStamp
            console.log('end of file - ' + new Date());
            console.log('duration = ' + this.state.durStamp / 1000 + ' sec')
            console.log('row count = ' + this.state.rowCount)
        });
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
        const lang = t[17]
        const tags = []
        for (var i = 0; i < 10; i++) {
            const c = t[29 + i]
            if (c != '""')
                tags.push(c)
        }
        console.warn(lang + ' | ' + tags.join(','))
    }
}