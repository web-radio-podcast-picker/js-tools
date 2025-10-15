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

}