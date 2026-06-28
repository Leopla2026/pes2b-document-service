exports.parse = (text) => {
    return {
        identificacao: {},
        documento: {
            tipo: 'EXTRATO_PGDAS'
        },
        datas: {},
        valores: {},
        extras: {
            mensagem: 'Parser ainda não implementado.'
        }
    };
};