exports.parse = (text) => {

    const empresa =
        text.match(/Nome Empresarial\s*([\s\S]*?)\s*CNPJ/i)?.[1]
            ?.replace(/\s+/g, ' ')
            ?.trim() || null;

    const cnpj =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || null;

    const competencia =
        text.match(/(\d{2}\/\d{4})/)?.[1] || null;

    const numeroRecibo =
        text.match(/Número do Recibo\s*([\d]+)/i)?.[1] || null;

    const numeroDeclaracao =
        text.match(/Número da Declaração\s*([\d]+)/i)?.[1] || null;

    const transmissao =
        text.match(/Data e Hora da Transmissão\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i)?.[1] || null;

    let dataTransmissao = null;
    let horaTransmissao = null;

    if (transmissao) {

        const partes = transmissao.split(" ");

        dataTransmissao = partes[0];

        horaTransmissao = partes[1];

    }

    return {

        empresa,

        cnpj,

        competencia,

        numeroRecibo,

        numeroDeclaracao,

        dataTransmissao,

        horaTransmissao,

        tipoDeclaracao: "Original"

    };

};