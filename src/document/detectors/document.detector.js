exports.detect = (text) => {

    const normalized = text.toUpperCase();

    // RECIBO PGDAS
    if (
        normalized.includes("RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D")
    ) {
        return "RECIBO_PGDAS";
    }

    // EXTRATO PGDAS
    if (
        normalized.includes("EXTRATO DO SIMPLES NACIONAL")
    ) {
        return "EXTRATO_PGDAS";
    }

    // DECLARAÇÃO PGDAS
    if (
        normalized.includes("PROGRAMA GERADOR DO DOCUMENTO DE ARRECADAÇÃO") &&
        normalized.includes("DECLARATÓRIO") &&
        normalized.includes("Nº DA DECLARAÇÃO")
    ) {
        return "DECLARACAO_PGDAS";
    }

    // GUIA DAS
    if (
        normalized.includes("DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL") &&
        (
            normalized.includes("PAGUE COM O PIX") ||
            normalized.includes("PAGAR ESTE DOCUMENTO ATÉ") ||
            normalized.includes("CÓDIGO PRINCIPAL") ||
            normalized.includes("AUTENTICAÇÃO MECÂNICA")
        )
    ) {
        return "DAS";
    }

    return "UNKNOWN";

};