exports.normalize = (text) => {

    return text

        // Windows
        .replace(/\r/g, '')

        // troca quebras por espaço
        .replace(/\n/g, ' ')

        // vários espaços
        .replace(/\s+/g, ' ')

        // remove espaços laterais
        .trim();

};