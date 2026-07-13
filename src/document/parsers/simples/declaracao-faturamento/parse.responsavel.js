module.exports = function parseResponsavel(text) {
    const conteudo = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();

    const crc =
        conteudo.match(
            /CRC\.?\s*:\s*([A-Z]{2}\d+[A-Z0-9]*)/i
        )?.[1] ||
        null;

    const cpf =
        conteudo.match(
            /CPF\.?\s*:\s*(\d{3}\.\d{3}\.\d{3}-\d{2})/i
        )?.[1] ||
        null;

    /*
     * Busca o nome imediatamente anterior ao CRC.
     */
    const nome =
        conteudo.match(
            /([A-ZÀ-Ú][A-ZÀ-Ú\s]+)\s+CRC\.?\s*:/i
        )?.[1]
            ?.replace(/\s+/g, ' ')
            .trim() ||
        null;

    return {
        nome,
        crc,
        cpf
    };
};