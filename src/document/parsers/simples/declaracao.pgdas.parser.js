exports.parse = (text) => {
    return {
        identificacao: {},
        documento: {
            tipo: 'DECLARACAO_PGDAS'
        },
        datas: {},
        valores: {},
        extras: {
            mensagem: 'Parser ainda não implementado.'
        }
    };
};