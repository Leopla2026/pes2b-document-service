const test = require('node:test');
const assert = require('node:assert/strict');

const parser = require('../src/document/parsers/simples/relatorio');

const textoMultiplosAnexos = `
Empresa: Emissão: Página: 0001 15/07/2026 SPEED WORK INFORMATICA LTDA. CNPJ: 01.006.445/0001-41
CPF Responsável: Código de Acesso: Período: 622.253.080-04 070715926625 05/2020
SIMPLES NACIONAL
Receita Bruta do período de Apuração (RPA) - Regime de Competência 10.238,00 0,00 10.238,00
Receita bruta acumulada nos doze meses anteriores ao período de apuração 122.916,51 0,00 122.916,51
Faixa de Enquadramento: 0,00 a 180.000,00
Receita bruta acumulada no ano-calendário corrente (RBA) 45.903,00 0,00 45.903,00
Receita bruta acumulada no ano-calendário anterior (RBA) 131.423,51 0,00 131.423,51
Anexo: Anexo I - Comércio
Seção: Seção I - Receitas decorrentes da revenda de mercadorias não sujeitas a substituição tributária
Tabela: Tabela 1 - Sem substituição tributária
Receita Tributada Total: 2.105,00 Alíquota: 2,6400000000000 Simples Nacional Total: 55,57
Anexo: Anexo I - Comércio
Seção: Seção II - Receitas decorrentes da revenda de mercadorias sujeitas a substituição tributária
Tabela: Tabela 1 - Substituição tributária somente do ICMS
Receita Tributada Total: 6.273,00 Alíquota: 2,6400000000000 Simples Nacional Total: 165,61
Anexo: Anexo III - Locação de Bens Móveis e Prestação de Serviços
Seção: Seção III - Receitas decorrentes de prestação de serviços
Tabela: Tabela 2 - Não sujeitos ao fator "r" - Sem retenção ou substituição tributária, com ISS devido ao próprio Município
Receita Tributada Total: 1.860,00 Alíquota: 6,0000000000000 Simples Nacional Total: 111,60
Outros Acréscimos: 0,00
Simples Nacional a recolher: 332,78
Sistema licenciado para JORGEPLA CONTABILIDADE LTDA ME
`;

test('extrai competência quando o valor não está logo após Período', () => {
    const result = parser.parse(textoMultiplosAnexos);
    assert.equal(result.identificacao.competencia, '05/2020');
});

test('extrai todas as apurações e consolida por anexo', () => {
    const result = parser.parse(textoMultiplosAnexos);

    assert.equal(result.apuracoes.length, 3);
    assert.equal(result.apuracoes[0].anexo, 'I');
    assert.equal(result.apuracoes[0].receitaTributadaNumero, 2105);
    assert.equal(result.apuracoes[1].tratamentoTributario, 'SUBSTITUICAO_TRIBUTARIA_ICMS');
    assert.equal(result.apuracoes[2].anexo, 'III');

    assert.equal(result.consolidacaoPorAnexo.length, 2);

    const anexoI = result.consolidacaoPorAnexo.find(item => item.anexo === 'I');
    const anexoIII = result.consolidacaoPorAnexo.find(item => item.anexo === 'III');

    assert.deepEqual(anexoI, {
        anexo: 'I',
        descricaoAnexo: 'Comércio',
        receitaTributadaNumero: 8378,
        valorSimplesNumero: 221.18,
        quantidadeApuracoes: 2,
        aliquotaMediaNumero: 2.64
    });

    assert.equal(anexoIII.receitaTributadaNumero, 1860);
    assert.equal(anexoIII.valorSimplesNumero, 111.6);
    assert.equal(anexoIII.aliquotaMediaNumero, 6);
});

test('calcula carga tributária total', () => {
    const result = parser.parse(textoMultiplosAnexos);

    assert.equal(result.resumo.receitaBrutaMesNumero, '10238.00');
    assert.equal(result.resumo.valorSimplesRecolherNumero, '332.78');
    assert.equal(result.resumo.cargaTributariaTotalNumero, 3.2504);
});
