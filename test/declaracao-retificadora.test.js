const test = require('node:test');
const assert = require('node:assert/strict');

const declaracaoParser = require(
    '../src/document/parsers/simples/declaracao'
);
const reciboParser = require(
    '../src/document/parsers/simples/recibo.pgdas.parser'
);
const {
    extrairMetadadosDeclaracao
} = require(
    '../src/document/parsers/simples/helpers/declaracao.metadata'
);

const textoRetificadora = `
Programa Gerador do Documento de Arrecadação do Simples Nacional - Declaratório
Declaração Retificadora
Período de Apuração: 01/06/2026 a 30/06/2026
CNPJ Matriz: 29.223.375/0001-00
Nome empresarial: 29.223.375 RENATO LUIZ DE SOUZA COSTA
Nº da Declaração: 29223375202606004
2.6) Resumo da Declaração
Receita Bruta Auferida (regime competência) Valor Total do Débito Declarado (R$)
18.939,46 1.136,35
Data e horário da transmissão da Declaração: 09/07/2026 20:30:40
Número do Recibo: 01.07.26190.0432924-9
Autenticação: 29040.22646.33104.75145
`;

const textoReciboRetificador = `
RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D
Declaração Retificadora
Nome Empresarial CNPJ da Matriz
29.223.375 RENATO LUIZ DE SOUZA COSTA 29.223.375/0001-00
06/2026 29223375202606004 R$ 18.939,46 R$ 1.136,35 R$ 0,00 R$ 1.136,35
Data e Horário da Transmissão (Data e Horário de Brasília)
09/07/2026 20:30:40
Número do Recibo
01.07.26190.0432924-9
Autenticação
29040.22646.33104.75145
`;

test('extrai metadados de declaração retificadora', () => {
    const resultado = extrairMetadadosDeclaracao(
        textoRetificadora
    );

    assert.equal(resultado.tipoDeclaracao, 'RETIFICADORA');
    assert.equal(resultado.ehRetificadora, true);
    assert.equal(
        resultado.numeroDeclaracao,
        '29223375202606004'
    );
    assert.equal(
        resultado.numeroRecibo,
        '01.07.26190.0432924-9'
    );
    assert.equal(
        resultado.dataTransmissaoISO,
        '2026-07-09T20:30:40-03:00'
    );
});

test('parser da declaração preserva estrutura e adiciona retificação', () => {
    const resultado = declaracaoParser.parse(
        textoRetificadora
    );

    assert.equal(resultado.documento.tipo, 'DECLARACAO_PGDAS');
    assert.equal(
        resultado.documento.tipoDeclaracao,
        'RETIFICADORA'
    );
    assert.equal(resultado.documento.ehRetificadora, true);
    assert.equal(
        resultado.recepcao.dataTransmissaoISO,
        '2026-07-09T20:30:40-03:00'
    );
});

test('parser do recibo identifica retificadora e valores numéricos', () => {
    const resultado = reciboParser.parse(
        textoReciboRetificador
    );

    assert.equal(resultado.documento.tipo, 'RECIBO_PGDAS');
    assert.equal(
        resultado.documento.tipoDeclaracao,
        'RETIFICADORA'
    );
    assert.equal(resultado.documento.ehRetificadora, true);
    assert.equal(resultado.valores.receitaBrutaNumero, 18939.46);
    assert.equal(
        resultado.valores.totalDebitoDeclaradoNumero,
        1136.35
    );
});

test('documento sem marcador fica como não identificado', () => {
    const resultado = extrairMetadadosDeclaracao(
        'Documento PGDAS sem indicação de versão'
    );

    assert.equal(
        resultado.tipoDeclaracao,
        'NAO_IDENTIFICADO'
    );
    assert.equal(resultado.ehRetificadora, false);
    assert.equal(
        resultado.tipoDeclaracaoIdentificado,
        false
    );
});
