exports.detect = (text) => {

    const normalized = text.toUpperCase();

    if (
        normalized.includes('DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL') ||
        normalized.includes('PGDAS')
    ) {
        return 'PGDAS';
    }

    if (
        normalized.includes('RECIBO DE ENTREGA')
    ) {
        return 'RECIBO';
    }

    if (
        normalized.includes('EXTRATO')
    ) {
        return 'EXTRATO';
    }

    return 'UNKNOWN';

};