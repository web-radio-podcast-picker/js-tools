// build unicode map from unicode referential

// unicode referential --> char ranges with categories (unicode:gc == general category)

import fs from 'fs'
import xml2js from 'xml2js'
import { GC_Cc, GC_Cf, GC_Co, GC_Cs, GC_Ll, GC_Lm, GC_Lo, GC_Lt, GC_Lu, GC_Mc, GC_Me, GC_Mn, GC_Nd, GC_Nl, GC_No, GC_Pc, GC_Pd, GC_Pe, GC_Pf, GC_Pi, GC_Po, GC_Ps, GC_Sc, GC_Sk, GC_Sm, GC_So, GC_Zl, GC_Zp, GC_Zs } from '../unicode-consts.js'

const UnicodeRefFilename = './data/ucd.all.grouped.xml'

export default class BuildUnicodeMap {

    run() {
        this.loadUnicodeReferential()
    }

    loadUnicodeReferential() {
        console.log('load ' + UnicodeRefFilename)
        const data = fs.readFileSync(UnicodeRefFilename)
        xml2js.parseString(data, (err, result) => {
            if (err) {
                throw err;
            }
            this.unicodeReferentialParsed(result);
        });
    }

    unicodeReferentialParsed(data) {
        console.log(UnicodeRefFilename + ' parsed')
        const rep = data.ucd.repertoire[0]
        var i = 0
        rep.group.forEach(x => {
            if (true || i == 0) {
                const props = x['$']
                if (props === undefined) {
                    console.log(x)
                }
                else
                    console.log(props.gc)
            }
            i++
        })
    }
}
