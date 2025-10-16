// utilitaries functions

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

    isLetter(char) {
        return char.toLowerCase() !== char.toUpperCase()
    }

    isDigit(char) {
        return char >= '0' && char <= '9'
    }

    isAlphabet(char) {
        return (char >= 'a' && char <= 'z')
            || (char >= 'A' && char <= 'Z')
    }

    normalizeTitle(title, excludeFirstChars, row) {
        const backTitle = title
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

    getFirstLetter(s, skipChars) {
        if (s == null || s === undefined || s == '' || s.length == 0) return null
        var c = s[0].toLowerCase()
        var i = 0
        while (skipChars.includes(c) && i < s.length - 1) {
            i++
            c = s[i].toLowerCase()
        }
        return c
    }
}