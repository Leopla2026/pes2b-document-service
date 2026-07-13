exports.detect = (text) => {

    const normalized =
        String(text || '').toUpperCase();

    /*
     * RELATÓRIO DO SIMPLES NACIONAL
     * GERADO PELO DOMÍNIO SISTEMAS
     *
     * Deve ficar antes dos demais detectores,
     * porque também contém várias expressões do Simples.
     */

    if (
        normalized.includes('SIMPLES NACIONAL') &&
        normalized.includes('TOTAL DE RECEITAS BRUTAS') &&
        normalized.includes(
            'RECEITA BRUTA DO PERÍODO DE APURAÇÃO'
        ) &&
        normalized.includes(
            'SIMPLES NACIONAL A RECOLHER'
        ) &&
        normalized.includes(
            'SISTEMA LICENCIADO PARA'
        )
    ) {
        return 'RELATORIO_SIMPLES';
    }

    /*
     * RECIBO PGDAS
     */

    if (
        normalized.includes(
            'RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D'
        )
    ) {
        return 'RECIBO_PGDAS';
    }

    /*
     * EXTRATO PGDAS
     */

    if (
        normalized.includes(
            'EXTRATO DO SIMPLES NACIONAL'
        )
    ) {
        return 'EXTRATO_PGDAS';
    }

    /*
     * DECLARAÇÃO PGDAS
     */

    if (
        normalized.includes(
            'PROGRAMA GERADOR DO DOCUMENTO DE ARRECADAÇÃO'
        ) &&
        normalized.includes('DECLARATÓRIO') &&
        normalized.includes('Nº DA DECLARAÇÃO')
    ) {
        return 'DECLARACAO_PGDAS';
    }

    /*
     * GUIA DAS
     */

    if (
        normalized.includes(
            'DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL'
        ) &&
        (
            normalized.includes('PAGUE COM O PIX') ||
            normalized.includes(
                'PAGAR ESTE DOCUMENTO ATÉ'
            ) ||
            normalized.includes('CÓDIGO PRINCIPAL') ||
            normalized.includes(
                'AUTENTICAÇÃO MECÂNICA'
            )
        )
    ) {
        return 'DAS';
    }

    return 'UNKNOWN';
};