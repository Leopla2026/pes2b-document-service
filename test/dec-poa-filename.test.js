const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizarNome,
  formatarCompetencia,
  buildDecPoaFileName
} = require(
  '../src/document/splitters/dec-poa.filename'
);

test('DEC POA filename: normaliza razão social', () => {
  assert.equal(
    normalizarNome(
      '4 LEDS COMPONENTES ELÉTRICOS LTDA.'
    ),
    '4_LEDS_COMPONENTES_ELETRICOS_LTDA'
  );
});

test('DEC POA filename: formata competência MM-AAAA', () => {
  assert.equal(
    formatarCompetencia({
      year: 2026,
      month: 7,
      reference: '2026-07'
    }),
    '07-2026'
  );
});

test('DEC POA filename: gera nome padrão da 4 LEDS', () => {
  assert.equal(
    buildDecPoaFileName({
      razaoSocial:
        '4 LEDS COMPONENTES ELÉTRICOS LTDA.',
      cnpj: '14572545000187',
      competence: {
        year: 2026,
        month: 7,
        reference: '2026-07'
      },
      suffix: 'declaracao'
    }),
    '4_LEDS_COMPONENTES_ELETRICOS_LTDA__14572545000187__07-2026_declaracao.pdf'
  );
});

test('DEC POA filename: gera nome padrão da Di Lorenzo', () => {
  assert.equal(
    buildDecPoaFileName({
      razaoSocial:
        'INCORPORADORA DI LORENZO APPEL SPE LTDA.',
      cnpj: '49.305.799/0001-13',
      competence: {
        reference: '2026-07'
      },
      suffix: 'guia'
    }),
    'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_guia.pdf'
  );
});

test('DEC POA filename: gera nome padrão da Born', () => {
  assert.equal(
    buildDecPoaFileName({
      razaoSocial:
        'BORN HOLDING LTDA. - ME',
      cnpj: '15.096.697/0001-13',
      competence: {
        year: 2026,
        month: 7
      },
      suffix: 'recibo'
    }),
    'BORN_HOLDING_LTDA_ME__15096697000113__07-2026_recibo.pdf'
  );
});

test('DEC POA filename: retorna null quando faltam dados obrigatórios', () => {
  assert.equal(
    buildDecPoaFileName({
      razaoSocial: 'EMPRESA TESTE',
      cnpj: null,
      competence: {
        reference: '2026-07'
      },
      suffix: 'declaracao'
    }),
    null
  );
});