const {
    findValue,
    normalizeMoney
} = require('../../helpers/parser.helpers');

function money(text, regex) {
    return findValue(text, regex);
}

module.exports = function parseResumo(text) {

    const receitaBrutaMes = money(
        text,
        /Receita Bruta do período de Apuração \(RPA\)\s*-\s*([\d.]+,\d{2})/i
    );

    const rbt12 = money(
        text,
        /Receita bruta acumulada nos doze meses anteriores\s*([\d.]+,\d{2})\s*ao período de apuração/i
    );

    const rbaAtual = money(
        text,
        /Receita bruta acumulada no ano-calendário\s*([\d.]+,\d{2})\s*corrente \(RBA\)/i
    );

    const rbaAnterior = money(
        text,
        /Receita bruta acumulada no ano-calendário\s*([\d.]+,\d{2})\s*anterior \(RBA\)/i
    );

    const faixaEnquadramento = findValue(
        text,
        /Faixa de Enquadramento:\s*(\d{1,3}(?:\.\d{3})*,\d{2}\s*a\s*\d{1,3}(?:\.\d{3})*,\d{2})/i
    );

    const anexo = findValue(
        text,
        /Anexo\s+([IVXLCDM]+)\s*-/i
    );

    const descricaoAnexo = findValue(
        text,
        /Anexo\s+[IVXLCDM]+\s*-\s*(.+?)\s*Anexo:/i
    );

    const receitaTributadaTotal = money(
        text,
        /Receita Tributada Total:\s*([\d.]+,\d{2})/i
    );

    const aliquota = findValue(
        text,
        /Receita Tributada Total:\s*[\d.]+,\d{2}\s*Alíquota:\s*([\d.,]+)/i
    );

    const valorSimplesTotal = money(
        text,
        /([\d.]+,\d{2})\s*Simples Nacional Total:/i
    );

    const valorSimplesRecolher = money(
        text,
        /([\d.]+,\d{2})\s*Simples Nacional a recolher:/i
    );

    return {

        /*
         * Mantemos os valores em texto no formato brasileiro
         * e também em formato numérico para futuras integrações.
         */

        receitaBrutaMes,
        receitaBrutaMesNumero: normalizeMoney(receitaBrutaMes),

        rbt12,
        rbt12Numero: normalizeMoney(rbt12),

        rbaAtual,
        rbaAtualNumero: normalizeMoney(rbaAtual),

        rbaAnterior,
        rbaAnteriorNumero: normalizeMoney(rbaAnterior),

        faixaEnquadramento,

        anexo,
        descricaoAnexo,

        receitaTributadaTotal,
        receitaTributadaTotalNumero:
            normalizeMoney(receitaTributadaTotal),

        aliquota,
        aliquotaNumero:
            normalizeMoney(aliquota),

        valorSimplesTotal,
        valorSimplesTotalNumero:
            normalizeMoney(valorSimplesTotal),

        valorSimplesRecolher,
        valorSimplesRecolherNumero:
            normalizeMoney(valorSimplesRecolher)
    };
};