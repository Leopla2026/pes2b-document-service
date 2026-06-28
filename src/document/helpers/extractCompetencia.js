function mesTextoParaNumero(mes) {
    const mapa = {
        janeiro: '01',
        fevereiro: '02',
        marco: '03',
        março: '03',
        abril: '04',
        maio: '05',
        junho: '06',
        julho: '07',
        agosto: '08',
        setembro: '09',
        outubro: '10',
        novembro: '11',
        dezembro: '12'
    };

    return mapa[mes.toLowerCase()] || null;
}

module.exports = (text) => {
    const competenciaPorExtenso = text.match(
        /(Janeiro|Fevereiro|Mar[cç]o|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/(\d{4})/i
    );

    if (competenciaPorExtenso) {
        return `${mesTextoParaNumero(competenciaPorExtenso[1])}/${competenciaPorExtenso[2]}`;
    }

    return text.match(/\b\d{2}\/\d{4}\b/)?.[0] || null;
};