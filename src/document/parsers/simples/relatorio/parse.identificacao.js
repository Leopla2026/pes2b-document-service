const {
    findCnpj,
    findDate
} = require('../../helpers/parser.helpers');

module.exports = function parseIdentificacao(text) {

    /*
     * Exemplo de início do texto extraído:
     *
     * Empresa: Emissão: Página:0001 09/07/2026
     * 29.223.375 RENATO LUIZ DE SOUZA COSTA
     * CNPJ:29.223.375/0001-00
     */

    const empresa =
        text.match(
            /Página:\s*\d+\s+\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+CNPJ:/i
        )?.[1]?.replace(/\s+/g, ' ').trim()

        || text.match(
            /Empresa:\s*(.+?)\s+CNPJ:/i
        )?.[1]?.replace(/\s+/g, ' ').trim()

        || null;

    /*
     * No relatório do Domínio, o CPF responsável pode aparecer
     * entre o rótulo "Período" e a competência.
     */

    const competencia =
        text.match(
            /Período:\s*(?:\d{3}\.\d{3}\.\d{3}-\d{2}\s*)?(\d{2}\/\d{4})/i
        )?.[1]

        || null;

    const dataEmissao =
        text.match(
            /Página:\s*\d+\s+(\d{2}\/\d{2}\/\d{4})/i
        )?.[1]

        || findDate(text)

        || null;

    /*
     * O relatório normalmente começa o nome empresarial
     * com o código interno da empresa no Domínio.
     *
     * Exemplo:
     * 29.223.375 RENATO LUIZ DE SOUZA COSTA
     */

    const codigoEmpresa =
        empresa?.match(/^([\d.]+)\s+/)?.[1]

        || text.match(
            /Estabelecimento:\s*(\d+)/i
        )?.[1]

        || null;

    return {
        empresa,
        cnpj: findCnpj(text),
        competencia,
        codigoEmpresa,
        dataEmissao
    };
};