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

    unknownLangsFilename = 'output/unknown-langs.json'
    knownLangsFilename = 'output/known-langs.json'
    allUnkownLangsGroupsNamesFilname = 'output/unkown-langs-groups-names-referential.json'
    allKownLangsGroupsNamesFilname = 'output/kown-langs-groups-names-referential.json'

    dumpTranslatedLangGroups = false
    dumpUnknownLangCode = false
    dumpUnknownLangGroups = false

    run(langs, langTrs, isoLangs, util) {
        console.log('> run')
        this.util = util
        this.langs = langs
        this.langTrs = langTrs
        this.isoLangs = isoLangs
        // normalize & substitute as much as possible not valid lang names (manually detected)
        this.translateLangNames()
        // rebuild groups using translated names
        this.buildTranslatedLangGroups()
        // rebuild groups keeping only ISO valid codes
        this.buildISOLangGroups()
        // build unknowns referential
        this.buildUnknownsLangsGroupsNamesReferential()
        // build knowns referential
        this.buildKnownsLangsGroupsNamesReferential()
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
            err => this.util.writeFileCB(err, this.unknownLangsFilename)
        )
        fs.writeFile(
            this.knownLangsFilename,
            JSON.stringify(this.gl2, null, 2),
            err => this.util.writeFileCB(err, this.knownLangsFilename)
        )

        console.log('unknown langs groups: ' + Object.getOwnPropertyNames(this.unknownLangs).length)
        if (this.dumpTranslatedLangGroups)
            console.log(this.gl['en'])
        if (this.dumpUnknownLangGroups)
            console.log(this.unknownLangs)
    }

    buildUnknownsLangsGroupsNamesReferential() {
        console.log('build unknowns langs groups names referential')
        const allUnkownLangsGroupsNames = { list: [], count_items: 0, count: 0 }
        for (const tnk in this.unknownLangs) {
            this.unknownLangs[tnk][0].forEach(n => {
                if (!allUnkownLangsGroupsNames.list.includes(n)) {
                    allUnkownLangsGroupsNames.list.push(n)
                }
            })
            allUnkownLangsGroupsNames.count_items += this.unknownLangs[tnk][1]
        }
        allUnkownLangsGroupsNames.count = allUnkownLangsGroupsNames.list.length
        fs.writeFile(
            this.allUnkownLangsGroupsNamesFilname,
            JSON.stringify(allUnkownLangsGroupsNames, null, 2),
            err => this.util.writeFileCB(err, this.allUnkownLangsGroupsNamesFilname)
        )
    }

    buildKnownsLangsGroupsNamesReferential() {
        console.log('build unknowns langs groups names referential')
        const allKownLangsGroupsNames = { map: {}, count_items: 0, count: 0 }
        for (const tnk in this.gl2) {
            this.gl2[tnk][0].forEach(n => {
                const o = allKownLangsGroupsNames.map[n]
                if (!o) {
                    allKownLangsGroupsNames.map[n] = this.gl2[tnk][2]['639-2']
                    allKownLangsGroupsNames.count++
                }
            })
            allKownLangsGroupsNames.count_items += this.gl2[tnk][1]
        }
        fs.writeFile(
            this.allKownLangsGroupsNamesFilname,
            JSON.stringify(allKownLangsGroupsNames, null, 2),
            err => this.util.writeFileCB(err, this.allKownLangsGroupsNamesFilname)
        )
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
                x = this.util.normalizeName(x)       // normalized name (before translation)
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
                    const baseName = this.util.normalizeName(t[0])
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
            const nname = this.util.normalizeName(tn[0])
            this.langKeys.push(nname)
            if (this.langTrs[nname]) {
                trs[nname] = this.langTrs[nname]
                n++
            }
        })
        this.trs = trs
        console.log('translate lang names: ' + n + ' translated')
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
                || ln.fr == nutil.writeFileCB
            ) {
                res = ln
                return res
            }
        }
        return res
    }
}