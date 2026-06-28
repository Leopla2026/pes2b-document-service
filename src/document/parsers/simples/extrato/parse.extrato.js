module.exports = function (text) {

    const geradoEm =
        text.match(/Gerado em\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2}:\d{2})/i);

    const apuradoEm =
        text.match(/Apurado em\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2}:\d{2})/i);

    return {

        versao:

            text.match(/Versão\s*([0-9.]+)/i)?.[1] ??

            null,

        tipoApuracao:

            text.match(/Apuração\s*(Original|Retificadora)/i)?.[1] ??

            null,

        geradoEm: geradoEm?.[1] || null,

        horaGeracao: geradoEm?.[2] || null,

        apuradoEm: apuradoEm?.[1] || null,

        horaApuracao: apuradoEm?.[2] || null

    };

};