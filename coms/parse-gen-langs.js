// parse gen langs
// db.podcast langs groups export -> normalized langs groups

export default class ParseGenLangs {

    gl = []
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

    dumpTranslatedLangGroups = true
    dumpUnknownLangCode = true

    run(langs, langTrs, isoLangs) {
        console.log('> run')
        this.langs = langs
        this.langTrs = langTrs
        this.isoLangs = isoLangs
        this.translateLangNames()
        this.buildTranslatedLangGroups()
        this.buildISOLangGroups()
    }

    buildISOLangGroups() {
        console.log('build ISO lang groups')
        const gl2 = []
        var qt = 0

        // langs -> unclassified
        const grps = { en: this.gl['en'] }

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
                tn.push(lang)
            }
        }

        console.log('unknown langs groups: ' + Object.getOwnPropertyNames(this.unknownLangs).length)
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
        for (lnk in t) {
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
}