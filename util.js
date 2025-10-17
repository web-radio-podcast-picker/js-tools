// utilitaries functions

import { isNumber, isLetter } from './unicode.js'

export default class Util {

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

    writeFileCB(err, fileName) {
        if (err) {
            console.error(err)
            console.error('error writing file: ' + fileName)
        }
        else
            console.log('file saved: ' + fileName)
    }

    assureIsUnquoted(s) {
        if (s == null || s === undefined || s == '' || s.length == 0) return s
        const sBack = s
        var first = s[0]
        var last = s[s.length - 1]
        while (first == last &&
            (first == "'" || first == '"')) {
            s = s.slice(1, -1)
            first = s[0]
            last = s[s.length - 1]
        }
        s = s.trim()
        //if (s.length == 0) return sBack   // TODO: fail ?
        return this.trimBrackets(s)
    }

    trimBrackets(s) {
        const a = s[0]
        const b = s[s.length - 1]
        if (a == '{' && b == '}') return s.slice(1, -1)
        if (a == '[' && b == ']') return s.slice(1, -1)
        if (a == '<' && b == '>') return s.slice(1, -1)
        if (a == '【' && b == '】') return s.slice(1, -1)
        return s
    }

    getUnicodeGroup(char, map) {
        for (var grk in map) {
            const grp = map[grk]
            if (char >= grp.firstCp && char <= grp.lastCp)
                return grp
        }
        return null
    }

    isLetter(char, map) {
        const grp = this.getUnicodeGroup(char, map)
        if (grp == null) return false
        return {
            isLetter: isLetter(grp.gc),
            grp: grp
        };
    }

    isDigit(char, map) {
        const grp = this.getUnicodeGroup(char, map)
        if (grp == null) return false
        return isNumber(char, grp.gc)
    }

    normalizeTitle(title, excludeFirstChars, row) {
        const backTitle = title
        title = title?.trim()
        try {
            // filter first char
            var end = false
            while (title.length > 0 && !end) {
                var n = 0
                excludeFirstChars.forEach(c => {
                    if (title.length > 0 && title[0] == c) {
                        n++
                        title = title.slice(1)
                    }
                })
                end = n == 0
            }

            title = title.trim()
            if (title.length == 0) title = backTitle

            // TODO: remove emoji ?
            // ...

            return title
        } catch (err) {
            console.error('empty title: ' + backTitle)
            console.error('row:' + row)
        }
    }

    getFirstLetter(s, map, skipSymbols) {
        if (s == null || s === undefined || s == '' || s.length == 0) return null
        var c = null
        var isL = null
        var i = 0
        var end = false
        while (!end && i < s.length) {
            c = s[i]//.toUpperCase()
            const cd = s.charCodeAt(i)
            isL = this.isLetter(cd, map)
            end = isL.isLetter &&
                !skipSymbols.includes(c)
            i++
        }
        return {
            letter: c,
            grp: isL.grp
        }
    }
}