// parse gen langs
// db.podcast langs groups export -> normalized langs groups

import fs from 'fs'

export default class ParseGenLangs {

    // langs groups
    gl = {}     // with unknowns
    gl2 = {}    // without unknowns
    // db translated langs groups
    langKeys = []
    // db langs groups export
    langs = null
    // lang groups names translations
    langTrs = null
    // iso langs
    isoLangs = null
    // unclassified lang codes
    unknownLangs = {}

    unknownLangsFilename = 'output/unknownLangs.json'
    knownLangsFilename = 'output/knownLangs.json'

    dumpTranslatedLangGroups = false
    dumpUnknownLangCode = false
    dumpUnknownLangGroups = false

    run(langs, langTrs, isoLangs) {
        console.log('> run')
        this.langs = langs
        this.langTrs = langTrs
        this.isoLangs = isoLangs
        // normalize & substitute as much as possible not valid lang names (manually detected)
        this.translateLangNames()
        // rebuild groups using translated names
        this.buildTranslatedLangGroups()
        // rebuild groups keeping only ISO valid codes
        this.buildISOLangGroups()
    }

    buildISOLangGroups() {
        console.log('build ISO lang groups')
        const gl2 = []
        var qt = 0

        // langs -> groups without any valid lang code (unknownLangs)

        const grps = this.gl // { en: this.gl['en'] }

        for (const tnk in grps) {
            const tn = this.gl[tnk]
            // langs codes of the group (tnk)
            const t = tn[0]
            var k = 0
            var lang = null
            t.forEach(n => {
                const ln = this.findLang(n)
                if (lang == null && ln != null)
                    lang = ln
                k += ln == null ? 0 : 1
            })
            if (k == 0) {
                // every lang code in the group is unknown
                if (this.dumpUnknownLangCode)
                    console.warn(tnk)
                // store the group
                this.unknownLangs[tnk] = tn
            } else {
                // every lang code in the group is associated with the iso lang code
                // push (index 2) the ISO lang descriptor
                // tn ::= [ langsCodes, count, isoLang ]
                tn.push(lang)
            }
        }

        // build classification without unknowns

        for (const tnk in this.gl) {
            if (this.unknownLangs[tnk] === undefined)
                this.gl2[tnk] = this.gl[tnk]
        }

        // store results in /out
        fs.writeFile(
            this.unknownLangsFilename,
            JSON.stringify(this.unknownLangs, null, 2),
            err => this.writeFileCB(err, this.unknownLangsFilename)
        )
        fs.writeFile(
            this.knownLangsFilename,
            JSON.stringify(this.gl2, null, 2),
            err => this.writeFileCB(err, this.knownLangsFilename)
        )

        console.log('unknown langs groups: ' + Object.getOwnPropertyNames(this.unknownLangs).length)
        if (this.dumpTranslatedLangGroups)
            console.log(this.gl['en'])
        if (this.dumpUnknownLangGroups)
            console.log(this.unknownLangs)
    }

    buildTranslatedLangGroups() {
        console.log('translate lang groups')

        this.langs.forEach(tn => {

            var n = tn[0]       // lang name
            const q = tn[1]     // quantity
            //logger.log(n)

            const lst = n.split(',')
            lst.forEach(x => {

                // fix/translate lang key
                x = this.normalizeName(x)       // normalized name (before translation)
                var trsl = null                 // translated name if any (else null)
                if (this.trs[x]) {
                    // translate the lang name
                    x = this.langTrs[x]
                    trsl = x
                }

                // make splits
                const t = x.split('-')
                const t2 = x.split('_')

                // resolve splits from ISO referential
                const prs = (s, t, q) => {
                    if (t.length != 2) return
                    const baseName = this.normalizeName(t[0])
                    if (this.langKeys.includes(baseName)) {
                        this.addToCat(baseName, s, q)
                    }
                    else {
                        this.addToCat(s, s, q)
                    }
                }

                if (t.length == 2 || t2.length == 2) {
                    prs(x, t, q)
                    prs(x, t2, q)
                } else {
                    this.addToCat(x, x, q)
                }
            })
        })

        if (this.dumpTranslatedLangGroups) {
            console.log(this.gl['en'])
        }
    }

    addToCat(langGroup, langCode, count) {
        if (this.gl[langGroup] === undefined)
            this.gl[langGroup] = [[], 0]
        if (!this.gl[langGroup][0].includes(langCode)) {
            this.gl[langGroup][0].push(langCode)
        }
        this.gl[langGroup][1] += count
    }

    translateLangNames() {
        const trs = []
        var n = 0
        this.langs.forEach(tn => {
            const nname = this.normalizeName(tn[0])
            this.langKeys.push(nname)
            if (this.langTrs[nname]) {
                trs[nname] = this.langTrs[nname]
                n++
            }
        })
        this.trs = trs
        console.log('translate lang names: ' + n + ' translated')
    }

    normalizeName(s) {
        if (s === undefined || s == null) return
        return s
            .replaceAll('"', '')
            .replaceAll('[', '')
            .replaceAll(']', '')
            .replaceAll('(', '')
            .replaceAll(')', '')
            .replaceAll('.', '')
            .replaceAll('$', '')
            .replaceAll('#', '')
            .replaceAll('<', '')
            .replaceAll('>', '')
            .replaceAll('?', '')
            .replaceAll("'", '')
            .toLowerCase()
            .trim()
    }

    findLang(n) {
        const t = this.isoLangs
        var res = null
        for (const lnk in t) {
            const ln = t[lnk]
            if (ln['639-1'] == n
                || ln['639-2'] == n
                || ln.de == n
                || ln.en == n
                || ln.fr == n
            ) {
                res = ln
                return res
            }
        }
        return res
    }

    writeFileCB(err, fileName) {
        if (err) {
            console.error(err)
            console.error('error writing file: ' + fileName)
        }
        else
            console.log('file saved: ' + fileName)
    }
}