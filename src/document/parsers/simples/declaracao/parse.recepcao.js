module.exports = function (text) {

    const transmissaoMatch = text.match(
        /Data e horário da transmissão da Declaração:\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/i
    );

    const numeroRecibo =
        text.match(/Número do Recibo:\s*([0-9.\-]+)/i)?.[1] ??
        text.match(/01\.\d{2}\.\d{5}\.\d{7}-\d/)?.[0] ??
        null;

    const autenticacao =
        text.match(/Autenticação:\s*([0-9.]+)/i)?.[1] ??
        text.match(/\d{5}\.\d{5}\.\d{5}\.\d{5}/)?.[0] ??
        null;

    return {
        dataTransmissao: transmissaoMatch?.[1] || null,
        horaTransmissao: transmissaoMatch?.[2] || null,
        numeroRecibo,
        autenticacao
    };

};