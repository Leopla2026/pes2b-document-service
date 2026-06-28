exports.detect = (text) => {

    const normalized = text.toUpperCase();

    // GUIA DAS
    if (
        normalized.includes("DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL") ||
        normalized.includes("PAGUE COM O PIX")
    ) {
        return "DAS";
    }

    // RECIBO
    if (
        normalized.includes("RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D")
    ) {
        return "RECIBO_PGDAS";
    }

    // DECLARAÇÃO
    if (
        normalized.includes("PROGRAMA GERADOR DO DOCUMENTO DE ARRECADAÇÃO") &&
        normalized.includes("DECLARAÇÃO ORIGINAL")
    ) {
        return "DECLARACAO_PGDAS";
    }

    // EXTRATO
    if (
        normalized.includes("EXTRATO DO SIMPLES NACIONAL")
    ) {
        return "EXTRATO_PGDAS";
    }

    return "UNKNOWN";

};