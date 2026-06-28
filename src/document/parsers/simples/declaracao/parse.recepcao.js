const {
    findDate,
    findHour,
    findCPF,
    findIP
} = require('../../helpers/parser.helpers');

module.exports = function (text) {

    const numeroRecibo =
        text.match(/01\.\d{2}\.\d{5}\.\d{7}-\d/)?.[0] ??
        null;

    const autenticacao =
        text.match(/\d{5}\.\d{5}\.\d{5}\.\d{5}/)?.[0] ??
        null;

    return {

        dataTransmissao: findDate(
            text,
            /(\d{2}\/\d{2}\/\d{4})/
        ),

        horaTransmissao: findHour(text),

        cpfResponsavel: findCPF(text),

        ip: findIP(text),

        numeroRecibo,

        autenticacao

    };

};