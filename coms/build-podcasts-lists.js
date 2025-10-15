// build podcasts lists (by lang, by alphabet and/or prefix)

import fs from 'fs'
import readline from 'readline'

export default class BuildPodcastsLists {

    dbExportFilename = 'data/podcastindex_feeds.db.csv'

    state = {
        startStamp: null,
        endStamp: null,
        durStamp: null,
        rowIndex: 0,
        rowCount: 0
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
            //console.log(`Line: ${line}`);
            this.processRow(line)
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
        if (this.state.rowIndex == 0)
            console.warn(row)
        this.state.rowCount++
        this.state.rowIndex++
    }
}