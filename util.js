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
}