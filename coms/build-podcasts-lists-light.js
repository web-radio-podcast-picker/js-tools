// build podcasts list light splits from podcasts full list splits

import fs from 'fs'

export default class BuildPodcastsListsLight {

    input = '../temp/podcasts-lists-full/'
    storePath = n => '../data' + n + '/'
    output = n => '../data' + n + '/podcasts-lists-light/'
    countsFilename = 'output/podcasts-lists-light-counts.json'
    filenameFieldSep = '-'  // '📚|📚'

    langs = {}      // { lang : { tag: [alpha] }}
    stores = []     // [n] = { folders: x , files: y, size: z }
    foldersCount = 0
    filesCount = 0
    traceAddFolder = false
    currentStore = 1
    limitProcessFileCount = 200000
    maxFilesPerDir = 1000
    maxFilesPerStore = 100000
    filterLang = '656e67'
    // 656e672d61667465722d73686f7773

    run(util) {
        this.util = util

        const files = fs.readdirSync(this.input)
        console.log('files count: ' + files.length)

        //this.util.dir(this.output)
        this.deleteOutputs()

        console.log('process files')

        files.every(file => {
            this.processFile(file)
            if (this.limitProcessFileCount == null) return true
            if (this.filesCount < this.limitProcessFileCount) return true
            console.warn('break on limitProcessFileCount reached: ' + this.limitProcessFileCount)
            return false
        })

        console.log('folders count: ' + this.foldersCount)
        console.log('files count: ' + this.filesCount)
        console.log('stores count: ' + this.stores.length)

        const dmp = JSON.stringify(this.stores, null, 2)
        fs.writeFile(
            this.countsFilename,
            dmp,
            err => this.util.writeFileCB(err, this.countsFilename)
        )
    }

    deleteOutputs() {
        var i = 1
        var end = false
        var path = null
        while (!end) {
            path = this.output(i)
            end = !fs.existsSync(path)
            if (!end) {
                const dirs = fs.readdirSync(path)
                end = dirs.length == 0
                if (!end) {
                    console.log('delete output store #' + i)
                    dirs.forEach(dir => {
                        this.util.deleteDirectory(path + dir)
                    })
                }
            }
        }
    }

    makeStore(i) {
        console.log('make store #' + i)

        const path = this.output(i)
        if (!fs.existsSync(path)) {

            const storePath = this.storePath(i)

            fs.mkdirSync(storePath, (err) => {
                if (err !== null) console.error(err)
            })

            fs.mkdirSync(path, (err) => {
                if (err !== null) console.error(err)
            })
        }

        const st = this.store(0, 0, 0, i)
        this.stores[i - 1] = st
        return st
    }

    store(folders, files, size, index) {
        return { folders: folders, files: files, size: size, index: index, counts: {} }
    }

    getStore(i) {
        var st = this.stores[i - 1]
        if (!st) {
            st = this.makeStore(i)
        }
        return st
    }

    processFile(file) {

        // get or prepare the store
        var storeNo = this.currentStore
        const store = this.getStore(storeNo)

        const sep = this.filenameFieldSep
        const dsep = sep + sep
        const fn = this.util.fromHex(file)
        const t = fn.split(sep)
        const lang = t[0]
        const langPath = this.util.toHex(lang)

        if (this.filterLang != null && this.filterLang != langPath)
            return

        const tag = t[1]
        var alpha = t.length > 2 ? t[2] : null
        if (fn.endsWith(dsep)) {
            console.error('error on ambiguous filename encoding: ' + fn)
            alpha = sep
        }
        //console.log(lang + ' ' + tag + ' ' + alpha)

        const klangs = Object.getOwnPropertyNames(this.langs)

        // make lang dir
        if (!klangs.includes(lang)) {
            this.makeLangDir(storeNo, lang)
        }

        const ktags = Object.getOwnPropertyNames(this.langs[lang])

        // make tag dir
        if (!ktags.includes(tag)) {
            this.makeTagDir(storeNo, lang, tag)
        }

        // make alpha dir

        if (alpha != null &&
            !this.langs[lang][tag].includes(alpha)
        ) {
            this.makeAlphaDir(storeNo, lang, tag, alpha)
        }

        // process & save file

        const tagPath = this.util.toHex(tag)
        const alphaPath = alpha != null ? this.util.toHex(alpha) : ''
        const outpath = this.output(storeNo)
            + langPath + '/'
            + tagPath + '/'
            + alphaPath
        const counts = this.getStoreCount(store, langPath, tagPath, alphaPath)
        this.incCount(store, langPath, tagPath, alphaPath)

        this.filesCount++
        store.files++
    }

    getStoreCount(store, langPath, tagPath, alphaPath) {
        if (!store.counts[langPath])
            store.counts[langPath] = {}
        if (!store.counts[langPath][tagPath])
            store.counts[langPath][tagPath] = { count: 0 }
        var cntp = null
        if (alphaPath != null && alphaPath != '') {
            if (!store.counts[langPath][tagPath][alphaPath])
                store.counts[langPath][tagPath][alphaPath] = { count: 0 }
            cntp = store.counts[langPath][tagPath][alphaPath]
        }
        else {
            cntp = store.counts[langPath][tagPath]
        }
        return cntp
    }

    incCount(store, langPath, tagPath, alphaPath) {
        this.getStoreCount(store, langPath, tagPath, alphaPath)
        if (alphaPath != null && alphaPath != '') {
            store.counts[langPath][tagPath][alphaPath].count
                = store.counts[langPath][tagPath][alphaPath].count + 1
        }
        else {
            store.counts[langPath][tagPath].count =
                store.counts[langPath][tagPath].count + 1
        }
    }

    makeLangDir(i, lang) {
        const langFolder = this.util.toHex(lang)
        const path = this.output(i) + langFolder
        fs.mkdirSync(path, (err) => {
            if (err !== null) console.error(err)
        })
        this.langs[lang] = []
        this.foldersCount++
        this.getStore(i).folders++
        if (this.traceAddFolder)
            console.log('add lang folder: ' + path)
    }

    makeTagDir(i, lang, tag) {
        const langFolder = this.util.toHex(lang) + '/'
        const tagFolder = this.util.toHex(tag)
        const path = this.output(i) + langFolder + tagFolder
        fs.mkdirSync(path, (err) => {
            if (err !== null) console.error(err)
        })
        this.langs[lang][tag] = []
        this.foldersCount++
        this.getStore(i).folders++
        if (this.traceAddFolder)
            console.log('add tag folder: ' + path)
    }

    makeAlphaDir(i, lang, tag, alpha) {
        const langFolder = this.util.toHex(lang) + '/'
        const tagFolder = this.util.toHex(tag) + '/'
        const alphaFolder = this.util.toHex(alpha)
        const path = this.output(i) + langFolder + tagFolder + alphaFolder
        fs.mkdirSync(path, (err) => {
            if (err !== null) console.error(err)
        })
        this.langs[lang][tag].push(alpha)
        this.foldersCount++
        this.getStore(i).folders++
        if (this.traceAddFolder)
            console.log('add alpha folder: ' + path)
    }
}