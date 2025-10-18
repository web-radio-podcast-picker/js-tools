// build unicode map from unicode referential

// unicode referential --> char ranges with categories (unicode:gc == general category)

import fs from 'fs'
import xml2js from 'xml2js'
import { isNumber, isLetter, GC_Cc, GC_Cf, GC_Co, GC_Cs, GC_Ll, GC_Lm, GC_Lo, GC_Lt, GC_Lu, GC_Mc, GC_Me, GC_Mn, GC_Nd, GC_Nl, GC_No, GC_Pc, GC_Pd, GC_Pe, GC_Pf, GC_Pi, GC_Po, GC_Ps, GC_Sc, GC_Sk, GC_Sm, GC_So, GC_Zl, GC_Zp, GC_Zs } from '../unicode.js'

const UnicodeRefFilename = './input/ucd.all.grouped.xml'

export default class BuildUnicodeMap {

    map = {}
    mapFilename = 'output/unicode-map.json'

    run(util) {
        this.util = util
        this.loadUnicodeReferential()
    }

    loadUnicodeReferential() {
        console.log('load ' + UnicodeRefFilename)
        const data = fs.readFileSync(UnicodeRefFilename)
        xml2js.parseString(data, (err, result) => {
            if (err) {
                throw err;
            }
            this.buildUnicodeReferential(result);
        });
    }

    buildUnicodeReferential(data) {
        console.log(UnicodeRefFilename + ' parsed')
        const rep = data.ucd.repertoire[0]
        var i = 0
        rep.group.forEach(x => {
            if (true || i == 0) {
                const props = x['$']
                if (props != undefined
                ) {
                    var c = ''
                    var fc = null
                    var lc = null
                    if (x.char) {
                        fc = x.char[0]['$']
                        lc = x.char[x.char.length - 1]['$']
                        c = fc.cp + ' - ' + lc.cp
                    }
                    const isL = isLetter(props.gc)
                    const isN = isNumber(props.gc)
                    /*console.log(
                        props.blk
                        + ' (' + props.gc + ')'
                        + (isL ? '✅' : '')
                        + ' ' + c
                    )*/
                    this.addUnicodeGroup(
                        props.blk,
                        isL,
                        isN,
                        props.gc,
                        fc.cp,
                        lc.cp)
                }
            }
            i++
        })
        console.log(this.map)
        this.saveMap()
    }

    addUnicodeGroup(name, isLetter, isNumber, gc, firstCp, lastCp) {
        this.map[name] = this.unicodeGroup(name, isLetter, isNumber, gc, firstCp, lastCp)
    }

    unicodeGroup(name, isLetter, isNumber, gc, firstCp, lastCp) {
        return {
            name: name,
            isLetter: isLetter,
            isNumber: isNumber,
            gc: gc,
            firstCp: parseInt('0x' + firstCp, 16),
            lastCp: parseInt('0x' + lastCp, 16)
        }
    }

    saveMap() {
        const s = JSON.stringify(this.map, null, 2)
        fs.writeFile(
            this.mapFilename,
            s,
            err => this.util.writeFileCB(err, this.mapFilename)
        )
    }
}
