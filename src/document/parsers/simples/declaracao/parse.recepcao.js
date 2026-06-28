const {
    findDate,
    findHour,
    findCPF,
    findIP
} = require('../../helpers/parser.helpers');

module.exports = function (text) {

    const numeroRecibo =
        text.match(/Número do Recibo\s*([0-9.\-]+)/i)?.[1] ??
        null;

    const autenticacao =
        text.match(/Autenticação\s*([0-9.]+)/i)?.[1] ??
        null;

    return {

        dataTransmissao: findDate(
            text,
            /Data e Horário da Transmissão[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i
        ),

        horaTransmissao: findHour(text),

        cpfResponsavel: findCPF(text),

        ip: findIP(text),

        numeroRecibo,

        autenticacao

    };

};