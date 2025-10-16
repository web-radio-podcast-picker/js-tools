// build unicode map from unicode referential

// unicode referential --> char ranges with categories (unicode:gc == general category)

import fs from 'fs'
import { GC_Cc, GC_Cf, GC_Co, GC_Cs, GC_Ll, GC_Lm, GC_Lo, GC_Lt, GC_Lu, GC_Mc, GC_Me, GC_Mn, GC_Nd, GC_Nl, GC_No, GC_Pc, GC_Pd, GC_Pe, GC_Pf, GC_Pi, GC_Po, GC_Ps, GC_Sc, GC_Sk, GC_Sm, GC_So, GC_Zl, GC_Zp, GC_Zs } from '../unicode-consts.js'

export default class BuildUnicodeMap {

    run() {
        this.loadUnicodeRef()
    }

    loadUnicodeRef() {

    }
}
